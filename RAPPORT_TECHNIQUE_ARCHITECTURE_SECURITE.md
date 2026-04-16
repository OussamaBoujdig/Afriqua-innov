# RAPPORT TECHNIQUE — ARCHITECTURE, API & SÉCURITÉ
## Innov'Hub — Plateforme de Gestion de l'Innovation

---

> **Version :** 2.0 | **Date :** 31 Mars 2026  
> **Stack :** Spring Boot 3.2.3 / Java 21 · Next.js 15.5.12 / React 19 · MySQL 8 · WebSocket STOMP  

---

## TABLE DES MATIÈRES

1. [Architecture Globale](#1-architecture-globale)
2. [Backend — Architecture & Concepts](#2-backend--architecture--concepts)
3. [Frontend — Architecture & Concepts](#3-frontend--architecture--concepts)
4. [Sécurité — Analyse Complète](#4-sécurité--analyse-complète)
5. [API REST — Catalogue Complet des Endpoints](#5-api-rest--catalogue-complet-des-endpoints)
6. [WebSocket — Communication Temps Réel](#6-websocket--communication-temps-réel)
7. [Base de Données — Schema & Migrations](#7-base-de-données--schema--migrations)
8. [Design Patterns & Concepts Architecturaux](#8-design-patterns--concepts-architecturaux)
9. [Diagramme d'Architecture en Couches](#9-diagramme-darchitecture-en-couches)
10. [Matrice de Dépendances](#10-matrice-de-dépendances)

---

## 1. Architecture Globale

### 1.1 Vue d'Ensemble — Architecture 3-Tiers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Navigateur)                             │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                   NEXT.JS 15 (Frontend)                          │  │
│   │                                                                   │  │
│   │  ┌─────────────┐ ┌──────────────┐ ┌───────────┐ ┌────────────┐ │  │
│   │  │ React 19    │ │ TailwindCSS 4│ │ TypeScript│ │ STOMP.js   │ │  │
│   │  │ App Router  │ │ Design System│ │ 5.9.3     │ │ SockJS     │ │  │
│   │  └─────────────┘ └──────────────┘ └───────────┘ └────────────┘ │  │
│   │                                                                   │  │
│   │  Port: 3000 │ SSR + CSR │ Turbopack (Dev)                       │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│              │ HTTP REST (JSON)              │ WebSocket (STOMP/SockJS) │
└──────────────┼──────────────────────────────┼──────────────────────────┘
               ▼                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      SPRING BOOT 3.2.3 (Backend)                        │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     COUCHE PRÉSENTATION                           │  │
│  │  ┌──────────────┐ ┌────────────────┐ ┌────────────────────────┐ │  │
│  │  │ REST         │ │ Security       │ │ WebSocket              │ │  │
│  │  │ Controllers  │ │ Filter Chain   │ │ Message Broker         │ │  │
│  │  │ (11 classes) │ │ (JWT Auth)     │ │ (STOMP/SockJS)        │ │  │
│  │  └──────────────┘ └────────────────┘ └────────────────────────┘ │  │
│  ├───────────────────────────────────────────────────────────────────┤  │
│  │                      COUCHE MÉTIER                                │  │
│  │  ┌──────────────┐ ┌────────────────┐ ┌────────────────────────┐ │  │
│  │  │ Services     │ │ DTOs           │ │ Exceptions             │ │  │
│  │  │ (9 classes)  │ │ (Request/Resp) │ │ (GlobalHandler)       │  │ │  │
│  │  └──────────────┘ └────────────────┘ └────────────────────────┘ │  │
│  ├───────────────────────────────────────────────────────────────────┤  │
│  │                     COUCHE PERSISTANCE                            │  │
│  │  ┌──────────────┐ ┌────────────────┐ ┌────────────────────────┐ │  │
│  │  │ JPA Entities │ │ Spring Data    │ │ Flyway Migrations     │  │ │  │
│  │  │ (10 classes) │ │ Repositories   │ │ (V1 → V8)            │  │ │  │
│  │  └──────────────┘ └────────────────┘ └────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  Port: 8081 │ Context: /api/v1 │ Java 21 │ Maven                       │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │ JDBC
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          MySQL 8.x                                       │
│  Database: innovhub │ Port: 3306 │ UTF8MB4 │ InnoDB                     │
│  12 tables │ UUID PKs │ Foreign Keys │ Triggers │ Indexes               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Flux de Communication

```
     Navigateur                    Backend                      BDD
        │                            │                            │
        │── GET /api/v1/ideas ──────►│                            │
        │   [Authorization: Bearer]  │── SELECT * FROM ideas ───►│
        │                            │◄── ResultSet ─────────────│
        │◄── 200 JSON ──────────────│                            │
        │                            │                            │
        │── WS CONNECT /ws ────────►│                            │
        │   [STOMP CONNECT frame]    │                            │
        │◄── CONNECTED ─────────────│                            │
        │                            │                            │
        │   (Backend event)          │── INSERT notification ───►│
        │◄── STOMP MESSAGE ─────────│                            │
        │   /user/{id}/queue/notif   │                            │
```

---

## 2. Backend — Architecture & Concepts

### 2.1 Stack Technique Détaillée

| Dépendance Maven | Version | Rôle |
|-------------------|---------|------|
| `spring-boot-starter-web` | 3.2.3 | Serveur HTTP embarqué (Tomcat), REST controllers |
| `spring-boot-starter-data-jpa` | 3.2.3 | ORM Hibernate, Spring Data repositories |
| `spring-boot-starter-security` | 3.2.3 | Chaîne de filtres sécurité, AuthenticationManager |
| `spring-boot-starter-validation` | 3.2.3 | Bean Validation (Jakarta `@Valid`) |
| `spring-boot-starter-websocket` | 3.2.3 | STOMP message broker, SockJS fallback |
| `mysql-connector-j` | 8.x | Driver JDBC MySQL |
| `jjwt-api` / `jjwt-impl` / `jjwt-jackson` | 0.12.3 | Création/validation JWT (HMAC-SHA) |
| `lombok` | latest | Réduction du boilerplate Java |
| `springdoc-openapi-starter-webmvc-ui` | 2.3.0 | Swagger UI + OpenAPI 3.0 auto-doc |

### 2.2 Couche Controller (Présentation)

**Pattern : REST Controller + DTO Pattern**

| Controller | Fichier | Endpoints | Responsabilité |
|-----------|---------|-----------|----------------|
| `AuthController` | `controller/AuthController.java` | 3 | Login, Refresh Token, Logout |
| `IdeaController` | `controller/IdeaController.java` | 12 | CRUD idées, workflow, scoring, votes, documents |
| `CampaignController` | `controller/CampaignController.java` | 5 | CRUD campagnes, clôture |
| `ProjectController` | `controller/ProjectController.java` | 18 | Projets, équipes, tâches, livrables, messages, invitations |
| `TaskController` | `controller/TaskController.java` | 3 | Tâches assignées, documents tâche |
| `UserController` | `controller/UserController.java` | 5 | CRUD utilisateurs, changement de rôle |
| `NotificationController` | `controller/NotificationController.java` | 5 | Notifications, lecture, suppression |
| `DashboardController` | `controller/DashboardController.java` | 1 | Statistiques agrégées |
| `DocumentController` | `controller/DocumentController.java` | 1 | Téléchargement de fichiers |
| `MessageController` | `controller/MessageController.java` | 1 | WebSocket message handler |
| `ChatbotController` | `controller/ChatbotController.java` | 1 | IA assistant conversationnel |

**Concepts clés utilisés :**
- `@RestController` + `@RequestMapping` — Annotations Spring MVC
- `@PreAuthorize("isAuthenticated()")` — Sécurité déclarative au niveau méthode
- `@Valid @RequestBody` — Validation automatique des DTOs
- `ResponseEntity<ApiResponse<T>>` — Enveloppe de réponse standardisée
- Injection de dépendance via `@RequiredArgsConstructor` (Lombok)

**Exemple de pattern — Réponse API standardisée :**
```java
// Toutes les réponses suivent ce format :
{
  "success": true,
  "message": "Connexion réussie",
  "data": { /* payload */ }
}

// En cas d'erreur :
{
  "success": false,
  "message": "Mot de passe incorrect",
  "data": null
}
```

### 2.3 Couche Service (Métier)

**Pattern : Service Layer + Transaction Management**

| Service | Lignes | Responsabilité |
|---------|--------|----------------|
| `AuthService` | 152 | Authentification, gestion tokens, CRUD utilisateurs |
| `IdeaService` | 552 | Logique métier idées, scoring, workflow complet |
| `CampaignService` | 120 | CRUD campagnes, calcul statut temporel |
| `ProjectService` | 712 | Gestion projets, équipes, tâches, livrables, invitations |
| `NotificationService` | 95 | Création et gestion des notifications |
| `DocumentService` | 147 | Upload/téléchargement fichiers, validation accès |
| `DashboardService` | 112 | Agrégation statistiques cross-table |
| `ProjectMessageService` | ~60 | Messages de chat projet |
| `WebSocketBroadcastService` | 28 | Diffusion WebSocket vers les clients |

**Concepts clés :**
- `@Service` — Marqueur Spring pour la couche métier
- `@Transactional` / `@Transactional(readOnly = true)` — Gestion déclarative des transactions
- **Separation of Concerns** : Chaque service gère un domaine métier unique
- **Validation métier** dans les services (vérification des rôles, statuts, ownership)
- `@Async` sur `WebSocketBroadcastService` — Envoi non-bloquant des notifications

### 2.4 Couche Entity (Persistance)

**Pattern : JPA Entity + Builder Pattern (Lombok)**

| Entity | Table | Clé primaire | Relations |
|--------|-------|-------------|-----------|
| `User` | `users` | UUID (String) | → Ideas, Scores, Projects, Messages |
| `Idea` | `ideas` | UUID (String) | → User, Campaign, Scores, Documents |
| `IdeaScore` | `idea_scores` | UUID (String) | → Idea, User (scorer) |
| `Campaign` | `campaigns` | UUID (String) | → User (creator), Ideas |
| `Project` | `projects` | UUID (String) | → User (owner), Idea, Deliverables, Tasks |
| `ProjectTask` | `project_tasks` | UUID (String) | → Project, User (assignee), User (creator) |
| `ProjectTeamMember` | `project_team_members` | UUID (String) | → Project, User |
| `TeamInvitation` | `team_invitations` | UUID (String) | → Project, User (invited), User (inviter) |
| `ProjectMessage` | `project_messages` | UUID (String) | → Project, User (sender) |
| `Document` | `documents` | UUID (String) | → Idea, Project, Task, User (uploader) |
| `RefreshToken` | `refresh_tokens` | UUID (String) | → User |

**Concepts JPA utilisés :**
- `@Entity` + `@Table` — Mapping objet-relationnel
- `@Id` avec `@GeneratedValue` ou UUID par défaut MySQL
- `@ManyToOne` / `@OneToMany` — Relations bidirectionnelles/unidirectionnelles
- `@Enumerated(EnumType.STRING)` — Persistence des enums en texte
- `@Builder` + `@Data` (Lombok) — Pattern Builder + getters/setters auto
- `@CreatedDate` / `@LastModifiedDate` — Audit automatique des timestamps
- Cascade et Fetch strategies optimisées

### 2.5 Couche Repository (Accès données)

**Pattern : Spring Data JPA Repository**

| Repository | Méthodes custom |
|-----------|----------------|
| `UserRepository` | `findByEmail()`, `existsByEmail()`, `findTop10ByOrderByPointsDesc()` |
| `IdeaRepository` | `findBySubmittedBy()`, `countByStatus()` |
| `IdeaScoreRepository` | `findByIdea_Id()`, `countByIdea_Id()`, `existsByIdea_IdAndScoredBy_Role()` |
| `VoteRepository` | `existsByIdea_IdAndUser_Id()`, `countByIdea_Id()` |
| `ProjectRepository` | `countByCurrentStage()` |
| `ProjectTaskRepository` | `findByProject_Id()`, `findByAssignedTo_Id()` |
| `ProjectTeamMemberRepository` | `findByProject_Id()`, `existsByProject_IdAndUser_Id()` |
| `TeamInvitationRepository` | `findByInvitedUser_Id()` |
| `ProjectMessageRepository` | `findByProject_Id()` |
| `DocumentRepository` | `findByIdea_Id()`, `findByProject_Id()`, `findByTask_Id()` |
| `NotificationRepository` | `findByUser_Id()`, `countByUser_IdAndIsReadFalse()` |
| `RefreshTokenRepository` | `findByToken()`, `deleteByUser_Id()` |

**Concepts clés :**
- Héritage de `JpaRepository<Entity, ID>` — CRUD automatique
- **Derived Query Methods** — `findByEmail()` → SQL auto-généré
- **Custom JPQL/Native Queries** via `@Query` quand nécessaire
- Pagination via `Pageable` + `Page<T>`

### 2.6 Gestion des Exceptions

**Pattern : Global Exception Handler (`@RestControllerAdvice`)**

```
Exception Hierarchy:
│
├── ResourceNotFoundException → 404 NOT_FOUND
├── ForbiddenException        → 403 FORBIDDEN
├── BadRequestException       → 400 BAD_REQUEST
├── AccessDeniedException     → 403 FORBIDDEN (Spring Security)
├── MethodArgumentNotValid    → 400 BAD_REQUEST (Bean Validation)
└── Exception (catch-all)     → 500 INTERNAL_SERVER_ERROR
```

Toutes les exceptions sont interceptées par `GlobalExceptionHandler` et retournées dans le format `ApiResponse<Void>` avec un message explicite.

---

## 3. Frontend — Architecture & Concepts

### 3.1 Stack Technique

| Technologie | Version | Rôle |
|-------------|---------|------|
| Next.js | 15.5.12 | Framework React avec App Router, SSR, Turbopack |
| React | 19.0 | Bibliothèque UI avec hooks |
| TypeScript | 5.9.3 | Typage statique, interfaces |
| TailwindCSS | 4.0 | Utility-first CSS framework |
| STOMP.js | 7.3.0 | Client STOMP pour WebSocket |
| SockJS Client | 1.6.1 | Transport fallback WebSocket |

### 3.2 Architecture des Fichiers (App Router)

```
src/
├── app/                              # ← Next.js App Router (file-based routing)
│   ├── layout.tsx                    # Root Layout — HTML, fonts, AppShell wrapper
│   ├── globals.css                   # Design System — tokens, animations, utilities
│   ├── page.tsx                      # Route: /           → Dashboard
│   ├── login/page.tsx                # Route: /login      → Authentification
│   ├── soumettre/page.tsx            # Route: /soumettre  → Wizard 3 étapes
│   ├── mes-idees/page.tsx            # Route: /mes-idees  → Grille/liste idées
│   ├── toutes-idees/page.tsx         # Route: /toutes-idees → Toutes idées (managers)
│   ├── campagnes/
│   │   ├── page.tsx                  # Route: /campagnes  → Liste campagnes
│   │   ├── creer/page.tsx            # Route: /campagnes/creer → Créer campagne
│   │   └── [id]/page.tsx             # Route: /campagnes/:id → Détail campagne
│   ├── approbation/page.tsx          # Route: /approbation → Kanban workflow
│   ├── suivi-projet/page.tsx         # Route: /suivi-projet → Gestion projets
│   ├── mes-taches/page.tsx           # Route: /mes-taches → Tâches assignées
│   ├── mes-invitations/page.tsx      # Route: /mes-invitations → Invitations
│   ├── messagerie/page.tsx           # Route: /messagerie → Chat projet
│   ├── gestion-utilisateurs/page.tsx # Route: /gestion-utilisateurs → Admin
│   └── profil/page.tsx               # Route: /profil → Profil utilisateur
│
├── components/                       # ← Composants réutilisables
│   ├── AppShell.tsx                  # Layout principal + Auth Guard
│   ├── Header.tsx                    # Barre supérieure + notifications
│   ├── Sidebar.tsx                   # Navigation latérale desktop
│   ├── MobileBottomNav.tsx           # Navigation mobile (bottom tabs)
│   ├── ChatbotWidget.tsx             # Widget chatbot IA flottant
│   └── ProjectChat.tsx               # Composant chat temps réel
│
├── context/
│   └── AuthContext.tsx               # ← React Context pour l'état auth global
│
└── lib/
    └── api.ts                        # ← Client HTTP centralisé + tous endpoints
```

### 3.3 Concepts Frontend Détaillés

#### 3.3.1 App Router (Next.js 15)

```
Concept: File-based Routing
─────────────────────────
src/app/campagnes/[id]/page.tsx → /campagnes/:id (route dynamique)
src/app/campagnes/creer/page.tsx → /campagnes/creer (route statique)
src/app/layout.tsx → Layout racine (appliqué à toutes les pages)
```

- **Server Components** par défaut dans Next.js 15
- **`"use client"`** explicite pour les composants interactifs (toutes les pages utilisent ce directive car elles gèrent un état local)
- **Turbopack** activé en développement (`next dev --turbopack`) pour un HMR ultra-rapide
- **Metadata API** : `export const metadata: Metadata` pour le SEO

#### 3.3.2 React Context API — Gestion d'État Auth

```
AuthProvider (Context Provider)
    │
    ├── Fournit: user, loading, login(), logout(), isRole()
    │
    ├── Mécanisme de persistance:
    │   1. Au montage: lit le JWT depuis localStorage
    │   2. Décode le payload JWT côté client (atob)
    │   3. Vérifie l'expiration localement
    │   4. Valide côté serveur via GET /users/me
    │   5. Si invalide → clearTokens() + redirect /login
    │
    └── useAuth() — Hook personnalisé pour accéder au contexte
```

**Sécurité côté client :**
- Le token JWT est vérifié **en deux étapes** : d'abord localement (expiration), puis côté serveur
- En cas de réponse 401, le client effectue un auto-logout

#### 3.3.3 Auth Guard Pattern (`AppShell.tsx`)

```
AppShell
├── AuthProvider (wraps entire app)
└── AuthGate (child)
    ├── Si loading → Loader animé
    ├── Si route publique (/login) → Rendu direct
    ├── Si !user && route privée → Redirect /login
    ├── Si user && route /login → Redirect /
    └── Si user && route privée → Header + Sidebar + Main + MobileNav + Chatbot
```

#### 3.3.4 Client HTTP Centralisé (`api.ts`)

```typescript
// Pattern: API Client avec intercepteur automatique
async function api<T>(path, options): Promise<ApiResponse<T>>

// Fonctionnalités:
// 1. Injection automatique du Bearer token
// 2. Content-Type JSON automatique (sauf FormData)
// 3. Auto-logout sur 401
// 4. Parsing JSON avec fallback texte
// 5. Enveloppe de réponse {success, message, data}
```

**Namespaces API organisés par domaine :**
```
api.ts exports:
├── auth      → login(), refresh(), logout()
├── ideas     → submit(), getAll(), getMine(), score(), workflow(), vote()...
├── campaigns → getAll(), create(), close()...
├── projects  → getAll(), getTasks(), getTeam(), sendMessage()...
├── dashboard → getStats()
├── notifications → getAll(), getUnreadCount(), markAllRead()...
├── users     → getMe(), getAll(), create(), updateRole(), delete()
├── chatbot   → send()
├── tasks     → getMine(), getDocuments(), uploadDocument()
└── downloadFile() → Téléchargement blob avec création de lien
```

#### 3.3.5 WebSocket Temps Réel (STOMP/SockJS)

```
Header.tsx / ProjectChat.tsx
│
├── Connexion via: new Client({ webSocketFactory: () => new SockJS(url) })
├── Auth: connectHeaders: { Authorization: "Bearer " + token }
├── Souscriptions:
│   ├── /user/{userId}/queue/notifications → Notifications push
│   ├── /user/{userId}/queue/invitations  → Nouvelles invitations
│   └── /topic/project/{id}/messages      → Chat projet temps réel
│
└── Cycle de vie:
    ├── Montage composant → client.activate()
    ├── Message reçu → update state (setNotifs, setMessages)
    └── Démontage → client.deactivate()
```

#### 3.3.6 Design System (TailwindCSS 4 + globals.css)

```
Design Tokens (@theme):
├── Couleurs: primary, primary-dark, primary-light, accent, success, danger
├── Surfaces: background-light/dark, surface-light/dark, border-light/dark
├── Typographie: Inter (Google Fonts), font-display
├── Bordures: radius, radius-lg, radius-xl, radius-2xl, radius-full
│
Animations personnalisées:
├── fadeInUp, fadeIn, slideInRight, slideDown, scaleIn
├── shimmer (skeleton loader), float, pulse-ring, spin-slow
│
Classes utilitaires:
├── .glass / .glass-dark — Glassmorphisme
├── .card-hover — Hover avec elevation
├── .btn-primary — Bouton gradient avec ombre
├── .input-ring — Focus state amélioré
├── .gradient-text — Texte en dégradé
├── .skeleton — Loader squelette
├── .page-enter — Animation d'entrée de page
```

---

## 4. Sécurité — Analyse Complète

### 4.1 Vue d'Ensemble de la Chaîne de Sécurité

```
        Requête HTTP entrante
              │
              ▼
┌─────────────────────────┐
│     CORS Filter          │  ← Vérifie l'origine (localhost:3000,3001,3002)
│     (Spring Security)    │     Méthodes: GET, POST, PUT, PATCH, DELETE, OPTIONS
│                          │     Headers: * (tous autorisés)
│                          │     Credentials: true
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│   CSRF Disabled          │  ← Désactivé car API stateless (JWT-based)
│                          │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│   URL Authorization      │  ← Routes publiques:
│                          │     /auth/login, /auth/refresh, /ws/**, /swagger-ui/**
│                          │     Toutes les autres: .authenticated()
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│   JwtAuthFilter          │  ← Intercepte chaque requête
│   (OncePerRequestFilter) │     1. Extrait "Authorization: Bearer <token>"
│                          │     2. Valide la signature HMAC-SHA
│                          │     3. Vérifie l'expiration
│                          │     4. Charge le User depuis la BDD
│                          │     5. Crée UsernamePasswordAuthenticationToken
│                          │     6. Place dans SecurityContextHolder
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│   Session: STATELESS     │  ← Pas de HttpSession côté serveur
│                          │     Chaque requête est authentifiée via JWT
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│   @PreAuthorize          │  ← Contrôle d'accès au niveau méthode
│   (Method Security)      │     Vérifie rôle, ownership, etc.
└───────────┬─────────────┘
            ▼
         Controller
```

### 4.2 Authentification JWT — Détails

#### 4.2.1 Génération du Token (JwtUtil.java)

```
JWT Access Token Structure:
─────────────────────────
Header:  { "alg": "HS256", "typ": "JWT" }

Payload: {
  "sub": "user-uuid-here",          ← Subject (User ID)
  "email": "user@company.com",
  "role": "RESPONSABLE_INNOVATION",
  "firstName": "John",
  "lastName": "Doe",
  "fullName": "John Doe",
  "iat": 1711872000,                ← Issued At
  "exp": 1711958400                 ← Expiration (+24h)
}

Signature: HMAC-SHA256(header.payload, SECRET_KEY)
```

**Configuration :**
- **Access Token** : durée 24h (`jwt.access-expiration: 86400000` ms)
- **Refresh Token** : durée 7 jours (`jwt.refresh-expiration: 604800000` ms)
- **Signing Key** : HMAC-SHA256, 256+ bits, configurable via `jwt.secret`
- **Librairie** : JJWT 0.12.3 (standard industriel Java)

#### 4.2.2 Refresh Token — Rotation sécurisée

```
FLUX DE REFRESH:
────────────────
1. Client envoie POST /auth/refresh { refreshToken: "uuid-token" }
2. Backend vérifie: token existe en BDD ? → Sinon 400
3. Backend vérifie: token non expiré ? → Sinon supprime + 400
4. Backend supprime l'ancien refresh token (ONE-TIME USE)
5. Backend génère nouveau access + refresh token
6. Backend sauvegarde le nouveau refresh token en BDD
7. Retourne les deux nouveaux tokens au client
```

**Protection contre le vol de token :**
- Les refresh tokens sont **UUID v4 aléatoires** (pas JWT), stockés en BDD
- Chaque utilisation **révoque** l'ancien et **crée** un nouveau
- À la déconnexion, **tous** les refresh tokens de l'utilisateur sont supprimés

#### 4.2.3 Auto-Logout (Frontend)

```typescript
// Dans api.ts — intercepteur HTTP
if (res.status === 401) {
  clearTokens();                    // Supprime access + refresh de localStorage
  window.location.href = "/login";  // Redirige vers login
  throw new Error("Session expirée");
}

// Dans AuthContext.tsx — au chargement
const payload = JSON.parse(atob(token.split(".")[1]));
if (payload.exp * 1000 < Date.now()) {
  clearTokens();  // Token expiré localement
}
```

### 4.3 Hashage des Mots de Passe

```
Algorithme: BCrypt (Spring BCryptPasswordEncoder)
─────────────────────────────────────────────────
- Rounds: 10 (par défaut Spring)
- Salt: Généré aléatoirement et intégré dans le hash
- Format: $2a$10$... (60 caractères)
- Résistant aux attaques par table arc-en-ciel
- Coût computationnel ajustable
```

### 4.4 CORS (Cross-Origin Resource Sharing)

```java
// SecurityConfig.java
configuration.setAllowedOrigins("http://localhost:3000,http://localhost:3001,http://localhost:3002");
configuration.setAllowedMethods(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);
configuration.setAllowedHeaders(["*"]);
configuration.setAllowCredentials(true);
```

- Seules les origines configurées dans `application.yml` sont autorisées
- `AllowCredentials: true` permet l'envoi de cookies/tokens

### 4.5 Sécurité WebSocket

```java
// WebSocketAuthConfig.java — Intercepteur STOMP CONNECT
if (StompCommand.CONNECT.equals(accessor.getCommand())) {
    String token = authHeader.substring(7);      // Extrait JWT
    if (jwtUtil.isTokenValid(token)) {
        String userId = jwtUtil.extractUserId(token);
        String role = jwtUtil.extractRole(token);
        var auth = new UsernamePasswordAuthenticationToken(userId, null, authorities);
        accessor.setUser(auth);                   // Associe l'identité au canal WS
    }
}
```

- Le token JWT est envoyé dans les headers STOMP lors de la connexion
- L'identité est extraite et associée à la session WebSocket
- Les messages sont routés via le `userDestinationPrefix` `/user/{id}/queue/...`

### 4.6 Autorisation par Rôle — Contrôle d'Accès

```
MATRICE D'ACCÈS (Backend enforced):
────────────────────────────────────
Endpoint                          │ PI │ RI │ DBU │ DG │
──────────────────────────────────┼────┼────┼─────┼────┤
POST   /ideas                     │ ✅ │ ❌ │ ❌  │ ❌ │
GET    /ideas (toutes)            │ ❌ │ ✅ │ ✅  │ ✅ │
GET    /ideas/mine                │ ✅ │ ✅ │ ✅  │ ✅ │
POST   /ideas/{id}/score          │ ❌ │ ✅ │ ✅  │ ✅ │
POST   /ideas/{id}/workflow       │ ❌ │ ✅ │ ✅  │ ✅ │
DELETE /ideas/{id}                │ ❌ │ ❌ │ ❌  │ ✅ │
POST   /campaigns                 │ ❌ │ ✅ │ ✅  │ ✅ │
POST   /users                     │ ❌ │ ✅ │ ❌  │ ❌ │
DELETE /projects/{id}             │ ❌ │ ❌ │ ❌  │ ✅ │
```

**Implémentation :**
- `@PreAuthorize("isAuthenticated()")` — Vérifie l'authentification
- Vérification programmatique du rôle dans les services :
  ```java
  if (user.getRole() != UserRole.RESPONSABLE_INNOVATION) {
      throw new ForbiddenException("Action non autorisée");
  }
  ```

### 4.7 Validation des Entrées

```
Couche 1 — Frontend:
  ├── Validation formulaire (required, type, pattern)
  ├── Wizard avec stepValid() avant progression
  └── Confirmation avant actions destructives

Couche 2 — Controller (Backend):
  ├── @Valid sur les DTOs → Bean Validation Jakarta
  ├── @NotBlank, @Email, @Size annotations
  └── MethodArgumentNotValidException → 400 avec détails

Couche 3 — Service (Backend):
  ├── Vérification d'existence (findById → ResourceNotFoundException)
  ├── Vérification de propriété (ownership check)
  ├── Vérification de statut (état métier valide)
  └── Vérification de rôle (ForbiddenException)
```

### 4.8 Sécurité du Stockage de Fichiers

```
Upload Flow:
1. Frontend: FormData avec fichier
2. Backend: @RequestParam("file") MultipartFile
3. Validation: taille max 10MB (config Spring)
4. Stockage: UUID_filename dans dossier serveur
5. Metadata en BDD: fileName, filePath, fileType, size, uploadedBy
6. Téléchargement: vérifie auth, lit depuis le disque, retourne blob

Protection:
- Nom de fichier randomisé (UUID prefix)
- Séparation par entité: /uploads/ideas/{id}/, /uploads/projects/{id}/
- Pas d'accès direct au filesystem (uniquement via API authentifiée)
- Contrôle d'accès pour les documents de tâches (assignee/creator/RI only)
```

### 4.9 Résumé des Mécanismes de Sécurité

| Mécanisme | Implémentation | Fichier(s) |
|-----------|---------------|------------|
| Authentification | JWT Access + Refresh Tokens | `JwtUtil.java`, `JwtAuthFilter.java` |
| Autorisation | Rôles + Ownership checks | `SecurityConfig.java`, Services |
| Hashage mot de passe | BCrypt (10 rounds) | `AuthService.java` |
| CORS | Whitelist d'origines | `SecurityConfig.java` |
| CSRF | Désactivé (API stateless) | `SecurityConfig.java` |
| Session | Stateless (pas de HttpSession) | `SecurityConfig.java` |
| WebSocket Auth | JWT dans headers STOMP | `WebSocketAuthConfig.java` |
| Validation entrées | Jakarta Bean Validation | DTOs + `@Valid` |
| Gestion exceptions | Global Handler centralisé | `GlobalExceptionHandler.java` |
| Upload sécurisé | UUID naming + ACL | `DocumentService.java` |
| Auto-logout | Intercepteur 401 frontend | `api.ts` |
| Token rotation | One-time-use refresh | `AuthService.java` |

---

## 5. API REST — Catalogue Complet des Endpoints

### 5.1 Authentification (`/auth`)

| # | Méthode | Endpoint | Auth | Description | Request Body | Response |
|---|---------|----------|------|-------------|-------------|----------|
| 1 | POST | `/auth/login` | ❌ | Connexion | `{email, password}` | `{accessToken, refreshToken, user}` |
| 2 | POST | `/auth/refresh` | ❌ | Renouveler token | `{refreshToken}` | `{accessToken, refreshToken, user}` |
| 3 | POST | `/auth/logout` | ✅ | Déconnexion | — | `{message}` |

### 5.2 Idées (`/ideas`)

| # | Méthode | Endpoint | Auth | Description |
|---|---------|----------|------|-------------|
| 4 | POST | `/ideas` | ✅ PI | Soumettre une idée |
| 5 | GET | `/ideas` | ✅ Manager | Toutes les idées (paginé) |
| 6 | GET | `/ideas/mine` | ✅ | Mes idées (paginé) |
| 7 | GET | `/ideas/{id}` | ✅ | Détail d'une idée |
| 8 | PUT | `/ideas/{id}` | ✅ | Modifier une idée |
| 9 | DELETE | `/ideas/{id}` | ✅ DG | Supprimer une idée |
| 10 | POST | `/ideas/{id}/score` | ✅ Manager | Scorer (5 critères) |
| 11 | POST | `/ideas/{id}/workflow` | ✅ Manager | Action workflow (validate/approve/reject/incubate/close) |
| 12 | PATCH | `/ideas/{id}/scoring-deadline` | ✅ RI | Définir deadline de scoring |
| 13 | POST | `/ideas/{id}/vote` | ✅ | Voter pour une idée |
| 14 | GET | `/ideas/{id}/documents` | ✅ | Documents de l'idée |
| 15 | POST | `/ideas/{id}/documents` | ✅ | Upload document (multipart) |

### 5.3 Campagnes (`/campaigns`)

| # | Méthode | Endpoint | Auth | Description |
|---|---------|----------|------|-------------|
| 16 | GET | `/campaigns` | ✅ | Liste campagnes (paginé) |
| 17 | GET | `/campaigns/{id}` | ✅ | Détail campagne |
| 18 | GET | `/campaigns/{id}/ideas` | ✅ | Idées d'une campagne |
| 19 | POST | `/campaigns` | ✅ Manager | Créer une campagne |
| 20 | PATCH | `/campaigns/{id}/close` | ✅ Manager | Clôturer campagne |

### 5.4 Projets (`/projects`)

| # | Méthode | Endpoint | Auth | Description |
|---|---------|----------|------|-------------|
| 21 | GET | `/projects` | ✅ Manager | Tous les projets (paginé) |
| 22 | GET | `/projects/{id}` | ✅ | Détail projet complet |
| 23 | DELETE | `/projects/{id}` | ✅ DG | Supprimer projet |
| 24 | PATCH | `/projects/{id}/stage` | ✅ RI | Avancer l'étape projet |
| 25 | PATCH | `/projects/{id}/progress` | ✅ | Mettre à jour la progression |
| 26 | POST | `/projects/{id}/deliverables` | ✅ | Ajouter un livrable |
| 27 | PATCH | `/projects/{id}/deliverables/{did}` | ✅ | Toggle livrable (fait/pas fait) |
| 28 | DELETE | `/projects/{id}/deliverables/{did}` | ✅ | Supprimer livrable |
| 29 | GET | `/projects/{id}/tasks` | ✅ | Tâches du projet |
| 30 | POST | `/projects/{id}/tasks` | ✅ RI | Créer tâche |
| 31 | PATCH | `/projects/{id}/tasks/{tid}` | ✅ | Modifier tâche |
| 32 | DELETE | `/projects/{id}/tasks/{tid}` | ✅ RI | Supprimer tâche |
| 33 | GET | `/projects/{id}/team` | ✅ | Équipe du projet |
| 34 | POST | `/projects/{id}/team` | ✅ RI | Inviter un membre |
| 35 | PATCH | `/projects/{id}/team/{mid}` | ✅ RI | Modifier rôle membre |
| 36 | DELETE | `/projects/{id}/team/{mid}` | ✅ RI | Retirer un membre |
| 37 | GET | `/projects/{id}/invitations` | ✅ | Invitations du projet |
| 38 | GET | `/projects/{id}/documents` | ✅ | Documents du projet |
| 39 | POST | `/projects/{id}/documents` | ✅ | Upload document projet |
| 40 | GET | `/projects/{id}/messages` | ✅ | Messages chat (paginé) |
| 41 | POST | `/projects/{id}/messages` | ✅ | Envoyer message (text/file) |
| 42 | GET | `/projects/invitations/mine` | ✅ | Mes invitations reçues |
| 43 | GET | `/projects/invitations/sent` | ✅ | Invitations envoyées |
| 44 | POST | `/projects/invitations/{iid}/respond` | ✅ | Accepter/Refuser invitation |
| 45 | GET | `/projects/my-team` | ✅ | Projets où je suis membre |

### 5.5 Tâches (`/tasks`)

| # | Méthode | Endpoint | Auth | Description |
|---|---------|----------|------|-------------|
| 46 | GET | `/tasks/mine` | ✅ | Mes tâches assignées |
| 47 | GET | `/projects/{pid}/tasks/{tid}/documents` | ✅ | Documents d'une tâche |
| 48 | POST | `/projects/{pid}/tasks/{tid}/documents` | ✅ | Upload doc tâche |

### 5.6 Utilisateurs (`/users`)

| # | Méthode | Endpoint | Auth | Description |
|---|---------|----------|------|-------------|
| 49 | GET | `/users/me` | ✅ | Mon profil |
| 50 | GET | `/users` | ✅ RI | Liste utilisateurs |
| 51 | POST | `/users` | ✅ RI | Créer utilisateur |
| 52 | PATCH | `/users/{id}/role` | ✅ RI | Changer rôle |
| 53 | DELETE | `/users/{id}` | ✅ RI | Désactiver utilisateur |

### 5.7 Notifications (`/notifications`)

| # | Méthode | Endpoint | Auth | Description |
|---|---------|----------|------|-------------|
| 54 | GET | `/notifications` | ✅ | Mes notifications (paginé) |
| 55 | GET | `/notifications/unread-count` | ✅ | Compteur non lues |
| 56 | PATCH | `/notifications/{id}/read` | ✅ | Marquer comme lue |
| 57 | PATCH | `/notifications/read-all` | ✅ | Tout marquer comme lu |
| 58 | DELETE | `/notifications` | ✅ | Supprimer toutes |

### 5.8 Autres

| # | Méthode | Endpoint | Auth | Description |
|---|---------|----------|------|-------------|
| 59 | GET | `/dashboard/stats` | ✅ | Stats KPI + pipeline |
| 60 | GET | `/documents/{id}/download` | ✅ | Télécharger fichier |
| 61 | POST | `/chatbot` | ✅ | Message chatbot IA |

**Total : 61 endpoints REST**

---

## 6. WebSocket — Communication Temps Réel

### 6.1 Configuration

```
Endpoint STOMP:    /ws (avec SockJS fallback)
Broker prefixes:   /topic (broadcast), /queue (point-to-point)
App prefix:        /app (messages client → serveur)
User prefix:       /user (messages serveur → user spécifique)
Allowed Origins:   * (toutes)
```

### 6.2 Canaux de Souscription

| Canal | Direction | Déclencheur | Payload |
|-------|-----------|-------------|---------|
| `/user/{userId}/queue/notifications` | Server → Client | Nouvelle notif créée | `NotificationResponse` |
| `/user/{userId}/queue/invitations` | Server → Client | Nouvelle invitation | `InvitationResponse` |
| `/topic/project/{projectId}/messages` | Server → Client | Nouveau message chat | `ProjectMessageResponse` |

### 6.3 Séquence de Connexion WebSocket

```
Client                          Serveur
  │                                │
  │── HTTP Upgrade /ws ──────────►│   (SockJS handshake)
  │◄── 101 Switching Protocols ──│
  │                                │
  │── STOMP CONNECT ─────────────►│   Headers: Authorization: Bearer <jwt>
  │   (WebSocketAuthConfig)        │   → Extrait userId, role
  │                                │   → Crée Authentication
  │◄── STOMP CONNECTED ──────────│
  │                                │
  │── SUBSCRIBE /user/X/queue/── ►│   Souscription aux notifications
  │                                │
  │     (événement métier)         │
  │◄── MESSAGE ──────────────────│   Push notification
```

---

## 7. Base de Données — Schema & Migrations

### 7.1 Stratégie de Migration

| Migration | Description |
|-----------|-------------|
| `V1__init_schema.sql` | Schema initial : users, campaigns, ideas, idea_scores, projects, deliverables, documents, notifications, votes, refresh_tokens + triggers + indexes |
| `V2__add_project_tasks_and_resp_users.sql` | Table project_tasks + seed users RI |
| `V3__add_task_id_to_documents.sql` | FK documents → project_tasks |
| `V4__fix_campaign_column_sizes.sql` | Ajustement colonnes campaigns |
| `V5__add_project_status.sql` | Colonne status sur projects |
| `V6__insert_responsable_password.sql` | Seed responsable@innovhub.com |
| `V7__add_project_team_members.sql` | Table project_team_members |
| `V8__backfill_idea_references_and_scores.sql` | Backfill references + recalcul scores |

**Note :** Les migrations sont exécutées par Hibernate `ddl-auto: update` (en dev), les fichiers SQL servent de référence pour la production.

### 7.2 Conventions de Base

- **PKs** : UUID v4 (VARCHAR(36)) générés par MySQL `DEFAULT (UUID())`
- **Timestamps** : `created_at`, `updated_at` avec `CURRENT_TIMESTAMP` et `ON UPDATE`
- **Soft delete** : `is_active` (users) au lieu de DELETE physique
- **Enums** : stockés en VARCHAR/ENUM pour lisibilité
- **Indexes** : sur les FK et colonnes de recherche fréquentes
- **Charset** : UTF8MB4 pour support complet Unicode

---

## 8. Design Patterns & Concepts Architecturaux

### 8.1 Backend Patterns

| Pattern | Application | Fichiers |
|---------|------------|----------|
| **MVC** | Séparation Controller → Service → Repository | Tout le backend |
| **DTO Pattern** | Objets de transfert séparés des entités | `dto/request/`, `dto/response/` |
| **Repository Pattern** | Abstraction de la couche données | `repository/` (Spring Data) |
| **Service Layer** | Logique métier isolée | `service/` |
| **Builder Pattern** | Construction d'objets complexes | Entités + DTOs (Lombok `@Builder`) |
| **Strategy Pattern** | Workflow actions (validate/approve/reject) | `IdeaService.workflow()` |
| **Observer Pattern** | Notifications async sur événements métier | `NotificationService` + `WebSocketBroadcastService` |
| **Interceptor Pattern** | Filtrage JWT des requêtes | `JwtAuthFilter` |
| **Factory Pattern** | Création de tokens JWT | `JwtUtil` |
| **Singleton** | Services Spring (scope default) | Tous les `@Service`, `@Component` |
| **Template Method** | `OncePerRequestFilter` | `JwtAuthFilter` |
| **Facade Pattern** | `api.ts` centralise tous les appels | Frontend |
| **Global Error Handling** | `@RestControllerAdvice` centralisé | `GlobalExceptionHandler` |

### 8.2 Frontend Patterns

| Pattern | Application | Fichiers |
|---------|------------|----------|
| **Context Provider** | État d'authentification global | `AuthContext.tsx` |
| **Custom Hook** | `useAuth()` pour accéder au contexte | `AuthContext.tsx` |
| **Auth Guard** | Protection des routes privées | `AppShell.tsx` |
| **API Client Singleton** | Client HTTP centralisé | `api.ts` |
| **Container/Presenter** | Pages (logique) + Components (UI) | `app/` + `components/` |
| **Compound Component** | Sidebar sections + items | `Sidebar.tsx` |
| **Render Props** | Kanban columns avec cards | `approbation/page.tsx` |
| **Optimistic UI** | Vote immédiat avant confirmation serveur | `mes-idees/page.tsx` |
| **Debounced Search** | Filtrage côté client avec useMemo | Toutes les pages de liste |
| **Stale-While-Revalidate** | Polling notifications toutes les 60s | `Header.tsx` |

### 8.3 Concepts Transversaux

| Concept | Implémentation |
|---------|---------------|
| **Stateless Auth** | JWT sans session serveur |
| **Token Rotation** | Refresh token à usage unique |
| **RBAC** | 4 rôles avec permissions granulaires |
| **Event-Driven** | WebSocket push sur événements métier |
| **Pagination** | Spring `Pageable` + `Page<T>` |
| **File-based Routing** | Next.js App Router |
| **Responsive Design** | Mobile-first avec breakpoints Tailwind |
| **Graceful Degradation** | SockJS fallback si WebSocket indisponible |
| **Optimistic Loading** | Squelette + animations d'entrée |

---

## 9. Diagramme d'Architecture en Couches

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                       ARCHITECTURE EN COUCHES                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                        COUCHE PRÉSENTATION                             │ ║
║  │                                                                         │ ║
║  │  Frontend (Next.js)          │    Backend (Spring)                     │ ║
║  │  ┌───────────────────────┐   │   ┌──────────────────────────────────┐ │ ║
║  │  │ Pages (app/)          │   │   │ REST Controllers (11)            │ │ ║
║  │  │ Components (6)        │   │   │ ├── @RequestMapping              │ │ ║
║  │  │ Auth Context          │   │   │ ├── @Valid + DTOs                │ │ ║
║  │  │ API Client            │   │   │ ├── ApiResponse<T> wrapper       │ │ ║
║  │  └───────────────────────┘   │   │ └── @PreAuthorize               │ │ ║
║  │                              │   └──────────────────────────────────┘ │ ║
║  └──────────────────────────────┴────────────────────────────────────────┘ ║
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                        COUCHE SÉCURITÉ                                │ ║
║  │                                                                         │ ║
║  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌───────────────────────┐│ ║
║  │  │ CORS     │ │ JWT      │ │ BCrypt       │ │ WS Auth (STOMP)      ││ ║
║  │  │ Filter   │ │ Filter   │ │ Password     │ │ Interceptor          ││ ║
║  │  └──────────┘ └──────────┘ └──────────────┘ └───────────────────────┘│ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                         COUCHE MÉTIER                                 │ ║
║  │                                                                         │ ║
║  │  ┌──────────────────────────────────────────────────────────────────┐ │ ║
║  │  │ Services (9)                                                      │ │ ║
║  │  │ ├── AuthService        (auth, tokens, users CRUD)                │ │ ║
║  │  │ ├── IdeaService        (idées, scoring, workflow, votes)         │ │ ║
║  │  │ ├── CampaignService    (campagnes CRUD, statut temporel)         │ │ ║
║  │  │ ├── ProjectService     (projets, équipes, tâches, livrables)     │ │ ║
║  │  │ ├── NotificationService(notifications CRUD, push)                │ │ ║
║  │  │ ├── DocumentService    (upload, download, ACL)                   │ │ ║
║  │  │ ├── DashboardService   (KPIs, pipeline, agrégations)            │ │ ║
║  │  │ ├── ProjectMessageService (chat persistance)                     │ │ ║
║  │  │ └── WebSocketBroadcast (push temps réel)                         │ │ ║
║  │  └──────────────────────────────────────────────────────────────────┘ │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                       COUCHE PERSISTANCE                              │ ║
║  │                                                                         │ ║
║  │  ┌────────────────┐  ┌────────────────┐  ┌──────────────────────────┐│ ║
║  │  │ JPA Entities   │  │ Spring Data    │  │ MySQL 8                  ││ ║
║  │  │ (10 entités)   │  │ Repositories   │  │ 12 tables               ││ ║
║  │  │ Hibernate ORM  │  │ (12 repos)     │  │ 8 migrations (Flyway)   ││ ║
║  │  └────────────────┘  └────────────────┘  └──────────────────────────┘│ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 10. Matrice de Dépendances

### 10.1 Backend — Dépendances Maven

```
spring-boot-starter-parent (3.2.3)
│
├── spring-boot-starter-web
│   ├── Spring MVC
│   ├── Tomcat (embedded)
│   └── Jackson (JSON)
│
├── spring-boot-starter-data-jpa
│   ├── Hibernate (6.x)
│   ├── Spring Data JPA
│   └── Jakarta Persistence API
│
├── spring-boot-starter-security
│   ├── Spring Security Core
│   ├── Spring Security Web
│   └── Spring Security Config
│
├── spring-boot-starter-validation
│   └── Jakarta Bean Validation (Hibernate Validator)
│
├── spring-boot-starter-websocket
│   ├── Spring WebSocket
│   └── Spring Messaging (STOMP)
│
├── mysql-connector-j (8.x)
│
├── jjwt-api + jjwt-impl + jjwt-jackson (0.12.3)
│   └── JSON Web Token creation/validation
│
├── lombok
│   └── @Data, @Builder, @RequiredArgsConstructor, @Slf4j
│
└── springdoc-openapi-starter-webmvc-ui (2.3.0)
    ├── Swagger UI
    └── OpenAPI 3.0 spec generation
```

### 10.2 Frontend — Dépendances npm

```
Production:
├── next (15.5.12) ─── Framework React avec App Router
├── react (19.0.0) ─── Bibliothèque UI
├── react-dom (19.0.0) ── Rendu DOM
├── @stomp/stompjs (7.3.0) ── Client STOMP pour WebSocket
└── sockjs-client (1.6.1) ── Transport WebSocket fallback

Development:
├── tailwindcss (4.0.0) ── CSS utility-first
├── @tailwindcss/postcss (4.0.0) ── PostCSS plugin
├── typescript (5.9.3) ── Typage statique
├── @types/node (22.0.0) ── Types Node.js
├── @types/react (19.0.0) ── Types React
├── @types/react-dom (19.0.0) ── Types React DOM
└── @types/sockjs-client (1.5.4) ── Types SockJS
```

---

## Conclusion

L'architecture d'Innov'Hub suit les **meilleures pratiques de l'industrie** :

1. **Séparation nette des responsabilités** : 3 couches backend (Controller → Service → Repository) + frontend découplé via API REST
2. **Sécurité en profondeur** : JWT stateless + BCrypt + CORS + validation multi-couche + ACL par rôle
3. **Communication temps réel** : WebSocket STOMP avec authentification JWT pour les notifications et le chat
4. **Code maintenable** : TypeScript strict côté frontend, Lombok + Spring patterns côté backend, DTOs séparés des entités
5. **Scalabilité** : Architecture stateless, pagination systématique, pooling de connexions Hikari

Le système expose **61 endpoints REST** et **3 canaux WebSocket**, couvrant l'intégralité du cycle de vie de l'innovation — de la soumission d'une idée jusqu'au déploiement en projet.

---

*Rapport technique généré le 31 Mars 2026 — Innov'Hub v2.0*
