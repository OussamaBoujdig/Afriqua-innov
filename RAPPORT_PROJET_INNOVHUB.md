# RAPPORT DE PROJET — INNOV'HUB
## Plateforme Centralisée de Gestion de l'Innovation d'Entreprise

---

> **Version :** 2.0  
> **Date :** 31 Mars 2026  
> **Équipe :** Développement Innovation  
> **Stack :** Spring Boot 3 · Next.js 15 · MySQL · WebSocket · JWT

---

## TABLE DES MATIÈRES

1. [Contexte & Problématique](#1-contexte--problématique)
2. [Vision & Objectifs](#2-vision--objectifs)
3. [Architecture Technique](#3-architecture-technique)
4. [Modèle de Données](#4-modèle-de-données)
5. [Rôles & Permissions](#5-rôles--permissions)
6. [Fonctionnalités Détaillées](#6-fonctionnalités-détaillées)
7. [Workflow Principal — Cycle de Vie d'une Idée](#7-workflow-principal--cycle-de-vie-dune-idée)
8. [Diagramme BPMN — Processus d'Innovation](#8-diagramme-bpmn--processus-dinnovation)
9. [Diagramme de Séquence — Soumission & Approbation](#9-diagramme-de-séquence--soumission--approbation)
10. [Diagramme de Cas d'Utilisation](#10-diagramme-de-cas-dutilisation)
11. [Architecture Applicative](#11-architecture-applicative)
12. [API REST — Endpoints](#12-api-rest--endpoints)
13. [Résultats & Bénéfices Attendus](#13-résultats--bénéfices-attendus)
14. [Roadmap & Évolutions](#14-roadmap--évolutions)

---

## 1. Contexte & Problématique

### 1.1 Contexte de l'Entreprise

Dans un environnement économique en constante mutation, les entreprises modernes font face à un défi majeur : **capitaliser sur l'intelligence collective de leurs collaborateurs** pour rester compétitives. Chaque département, chaque équipe, chaque individu possède des idées susceptibles de transformer les processus, d'optimiser les coûts ou d'ouvrir de nouveaux marchés.

Cependant, la réalité opérationnelle révèle un paradoxe : **les idées existent, mais elles se perdent**.

### 1.2 Problématique Identifiée

Avant la mise en place d'Innov'Hub, l'entreprise souffrait de plusieurs dysfonctionnements critiques :

#### 🔴 Fragmentation des initiatives
Chaque département innove **de son côté**, en silo :
- Le département **Technologie** développe ses propres outils sans coordination
- Les équipes **RH** proposent des améliorations de processus via des emails informels
- Le département **Marketing** lance des initiatives sans visibilité transverse
- Les équipes **Opérations** et **RSE** accumulent des idées non formalisées

Cette fragmentation entraîne :
- Des **doublons de projets** entre départements
- Une **perte de synergies** potentielles
- Un **gaspillage de ressources** sur des initiatives redondantes
- Une **démotivation des collaborateurs** dont les idées ne sont jamais traitées

#### 🔴 Absence de processus formalisé
- Aucun canal standardisé pour soumettre une idée
- Pas de critères d'évaluation objectifs
- Décisions prises de manière informelle et subjective
- Aucune traçabilité du parcours d'une idée

#### 🔴 Manque de visibilité managériale
- Les Directeurs de BU n'ont pas de vision consolidée des innovations en cours
- Le Directeur Général ne peut pas piloter la stratégie d'innovation
- Impossible de mesurer le ROI des initiatives innovantes

#### 🔴 Perte de capital intellectuel
- Les idées rejetées ne sont pas documentées
- Les bonnes pratiques ne sont pas partagées
- Les innovateurs ne sont pas reconnus ni récompensés

### 1.3 La Solution : Centralisation via Innov'Hub

**Innov'Hub** répond à cette problématique en proposant une **plateforme unifiée** qui :

> *"Centralise toutes les initiatives d'innovation de l'entreprise, de la simple idée jusqu'au projet déployé, avec un processus d'évaluation transparent, collaboratif et traçable."*

---

## 2. Vision & Objectifs

### 2.1 Vision

Créer un **écosystème d'innovation** où chaque collaborateur, quel que soit son département, peut contribuer à la transformation de l'entreprise via un processus structuré, équitable et valorisant.

### 2.2 Objectifs Stratégiques

| Objectif | Indicateur | Cible |
|----------|-----------|-------|
| Augmenter le volume d'idées soumises | Nombre d'idées/mois | +300% vs avant |
| Réduire le délai d'évaluation | Jours moyen de traitement | < 15 jours |
| Améliorer le taux de transformation | Idées → Projets | > 15% |
| Engager les collaborateurs | Taux de participation | > 60% des effectifs |
| Valoriser les innovateurs | Score de gamification | Classement mensuel |

---

## 3. Architecture Technique

### 3.1 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    INNOV'HUB PLATFORM                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────────────┐  │
│  │   FRONTEND       │         │      BACKEND             │  │
│  │   Next.js 15     │◄───────►│   Spring Boot 3.x        │  │
│  │   React 19       │  REST   │   Java 21                │  │
│  │   TailwindCSS 4  │  +WS    │   Port 8081              │  │
│  │   Port 3000      │         │   /api/v1                │  │
│  └──────────────────┘         └──────────┬───────────────┘  │
│                                          │                   │
│                               ┌──────────▼───────────────┐  │
│                               │      MySQL 8.x           │  │
│                               │      Port 3306           │  │
│                               │      DB: innovhub        │  │
│                               └──────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              COMMUNICATIONS TEMPS RÉEL               │   │
│  │    WebSocket (STOMP/SockJS) — Notifications & Chat   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Stack Technologique

#### Frontend
| Technologie | Version | Rôle |
|------------|---------|------|
| Next.js | 15.5.12 | Framework React SSR/CSR |
| React | 19.0 | UI Library |
| TailwindCSS | 4.0 | Styling utilitaire |
| TypeScript | 5.9.3 | Typage statique |
| STOMP.js | 7.3.0 | Client WebSocket |
| SockJS | 1.6.1 | Fallback WebSocket |

#### Backend
| Technologie | Version | Rôle |
|------------|---------|------|
| Spring Boot | 3.x | Framework Java |
| Spring Security | 6.x | Authentification & Autorisation |
| Spring Data JPA | 3.x | ORM / Persistance |
| Spring WebSocket | 3.x | Temps réel |
| Flyway | 9.x | Migrations DB |
| JWT (JJWT) | 0.12 | Tokens d'authentification |
| MySQL Connector | 8.x | Driver JDBC |
| SpringDoc OpenAPI | 2.x | Documentation API |

---

## 4. Modèle de Données

### 4.1 Diagramme Entité-Relation (ERD)

```
┌─────────────────┐      ┌──────────────────────┐      ┌──────────────────┐
│     USERS       │      │        IDEAS          │      │    CAMPAIGNS     │
├─────────────────┤      ├──────────────────────┤      ├──────────────────┤
│ id (PK)         │◄────►│ id (PK)              │◄────►│ id (PK)          │
│ email           │      │ reference (UNIQUE)   │      │ title            │
│ password_hash   │      │ title                │      │ description      │
│ first_name      │      │ category             │      │ category         │
│ last_name       │      │ problem_statement    │      │ category_color   │
│ role            │      │ proposed_solution    │      │ image_url        │
│ business_unit   │      │ expected_roi         │      │ status           │
│ department      │      │ estimated_cost       │      │ start_date       │
│ points          │      │ status               │      │ end_date         │
│ is_active       │      │ total_score          │      │ created_by (FK)  │
│ last_login_at   │      │ campaign_id (FK)     │      └──────────────────┘
└─────────────────┘      │ submitted_by (FK)    │
         │               │ submitted_at         │
         │               └──────────────────────┘
         │                          │
         │               ┌──────────▼───────────┐
         │               │     IDEA_SCORES      │
         │               ├──────────────────────┤
         │               │ id (PK)              │
         │               │ idea_id (FK)         │
         │               │ scored_by (FK)       │
         │               │ innovation_level     │
         │               │ technical_feasibility│
         │               │ strategic_alignment  │
         │               │ roi_potential        │
         │               │ risk_level           │
         │               │ total_score          │
         │               │ comments             │
         │               └──────────────────────┘
         │
         │    ┌──────────────────────┐      ┌──────────────────────┐
         │    │      PROJECTS        │      │    PROJECT_TASKS     │
         │    ├──────────────────────┤      ├──────────────────────┤
         └───►│ id (PK)             │◄────►│ id (PK)              │
              │ name                │      │ project_id (FK)      │
              │ description         │      │ title                │
              │ current_stage       │      │ description          │
              │ stage_progress      │      │ stage                │
              │ status              │      │ status               │
              │ owner_id (FK)       │      │ assigned_to (FK)     │
              │ idea_id (FK)        │      │ due_date             │
              │ due_date            │      └──────────────────────┘
              │ launched_at         │
              └──────────┬──────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
┌────────▼──────┐ ┌──────▼──────┐ ┌────▼──────────────┐
│ DELIVERABLES  │ │   TEAM      │ │  PROJECT_MESSAGES  │
├───────────────┤ ├─────────────┤ ├────────────────────┤
│ id (PK)       │ │ id (PK)     │ │ id (PK)            │
│ project_id FK │ │ project_id  │ │ project_id (FK)    │
│ title         │ │ user_id FK  │ │ sender_id (FK)     │
│ stage         │ │ team_role   │ │ content            │
│ is_done       │ │ added_at    │ │ file_name          │
│ done_at       │ └─────────────┘ │ sent_at            │
└───────────────┘                 └────────────────────┘
```

### 4.2 Tables Principales

| Table | Lignes estimées | Description |
|-------|----------------|-------------|
| `users` | 50-500 | Tous les utilisateurs de la plateforme |
| `ideas` | 100-5000 | Idées soumises par les porteurs |
| `idea_scores` | 300-15000 | Évaluations multi-critères |
| `campaigns` | 10-100 | Campagnes d'innovation thématiques |
| `projects` | 20-500 | Projets en incubation |
| `project_tasks` | 100-2000 | Tâches assignées aux membres |
| `project_team_members` | 100-1000 | Équipes projet |
| `team_invitations` | 50-500 | Invitations en attente |
| `project_messages` | 1000-50000 | Messages de chat projet |
| `documents` | 200-5000 | Fichiers attachés |
| `notifications` | 1000-100000 | Notifications système |
| `votes` | 500-20000 | Votes sur les idées |

---

## 5. Rôles & Permissions

### 5.1 Matrice des Rôles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HIÉRARCHIE DES RÔLES                                  │
│                                                                               │
│  DIRECTEUR_GENERAL                                                            │
│       │  • Approbation finale (niveau 3)                                     │
│       │  • Vision globale de tous les projets                                │
│       │  • Tableau de bord stratégique                                       │
│       │  • Scoring des idées                                                  │
│       ▼                                                                       │
│  DIRECTEUR_BU                                                                 │
│       │  • Approbation niveau 2 (BU)                                         │
│       │  • Suivi des projets de sa BU                                        │
│       │  • Scoring des idées                                                  │
│       │  • Messagerie projet                                                  │
│       ▼                                                                       │
│  RESPONSABLE_INNOVATION                                                       │
│       │  • Gestion complète du workflow                                      │
│       │  • Administration des utilisateurs                                   │
│       │  • Création de campagnes                                             │
│       │  • Scoring + approbation niveau 1                                    │
│       │  • Gestion des projets & équipes                                     │
│       ▼                                                                       │
│  PORTEUR_IDEE                                                                 │
│          • Soumission d'idées                                                 │
│          • Consultation de ses idées                                          │
│          • Vote sur les idées                                                 │
│          • Participation aux projets (si invité)                              │
│          • Messagerie projet (si membre)                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Tableau des Permissions Détaillé

| Fonctionnalité | PORTEUR_IDEE | RESP_INNOVATION | DIRECTEUR_BU | DIRECTEUR_GENERAL |
|---------------|:---:|:---:|:---:|:---:|
| Soumettre une idée | ✅ | ❌ | ❌ | ❌ |
| Voir ses idées | ✅ | ✅ | ✅ | ✅ |
| Voir toutes les idées | ❌ | ✅ | ✅ | ✅ |
| Voter sur une idée | ✅ | ✅ | ✅ | ✅ |
| Scorer une idée | ❌ | ✅ | ✅ | ✅ |
| Approuver (niv. 1) | ❌ | ✅ | ❌ | ❌ |
| Approuver (niv. 2) | ❌ | ❌ | ✅ | ❌ |
| Approuver (niv. 3) | ❌ | ❌ | ❌ | ✅ |
| Rejeter une idée | ❌ | ✅ | ✅ | ✅ |
| Créer une campagne | ❌ | ✅ | ✅ | ✅ |
| Gérer les projets | ❌ | ✅ | ✅ | ✅ |
| Inviter dans un projet | ❌ | ✅ | ✅ | ✅ |
| Voir ses tâches | ✅ | ✅ | ✅ | ✅ |
| Messagerie projet | ✅* | ✅ | ✅ | ✅ |
| Gérer utilisateurs | ❌ | ✅ | ❌ | ❌ |
| Dashboard complet | ❌ | ✅ | ✅ | ✅ |
| Supprimer une idée | ❌ | ❌ | ❌ | ✅ |

*Si membre de l'équipe projet

---

## 6. Fonctionnalités Détaillées

### 6.1 🔐 Authentification & Sécurité

**Module :** `AuthController`, `AuthService`, `JwtUtil`, `SecurityConfig`

#### Fonctionnalités :
- **Connexion sécurisée** via email/mot de passe
- **JWT Access Token** (durée : 24h) + **Refresh Token** (durée : 7 jours)
- **Auto-logout** sur token expiré (intercepteur HTTP 401)
- **Validation côté client** du token avant requête serveur
- **Déconnexion** avec invalidation du token
- **WebSocket Auth** via token JWT dans les headers STOMP

#### Sécurité :
- Mots de passe hashés avec BCrypt
- CORS configuré pour les origines autorisées
- Endpoints publics : `/auth/login`, `/auth/refresh`
- Tous les autres endpoints nécessitent un JWT valide

---

### 6.2 💡 Gestion des Idées

**Module :** `IdeaController`, `IdeaService`, `IdeaRepository`

#### Soumission d'idée (Wizard 3 étapes)
```
Étape 1 — Informations de base
├── Titre de l'idée
├── Catégorie (Technologie / Opérations / RH / Marketing / RSE)
├── Problématique identifiée (textarea)
└── Solution proposée (textarea)

Étape 2 — Détails & ROI
├── ROI attendu (description libre)
├── Coût estimé (€)
└── Campagne associée (optionnel)

Étape 3 — Pièces jointes
├── Upload de fichiers (PDF, images, docs)
└── Prévisualisation des fichiers
```

#### États d'une idée
```
BROUILLON → SOUMISE → EN_VALIDATION → SCOREE → APPROUVEE_INNOVATION
                                                        ↓
                                               APPROUVEE_BU
                                                        ↓
                                               APPROUVEE_DG → EN_INCUBATION → CLOTUREE
                                                                    ↓
                                                               (→ Projet créé)
                                               
                              À tout moment : → REJETEE
```

#### Fonctionnalités avancées :
- **Référence automatique** : `ID-2026-001` (trigger MySQL)
- **Sauvegarde brouillon** : soumission partielle possible
- **Vote** : chaque utilisateur peut voter une fois par idée
- **Scoring multi-critères** : 5 dimensions notées de 1 à 10
- **Deadline de scoring** : date limite configurable par le RI
- **Upload de documents** : jusqu'à 10MB par fichier
- **Filtres avancés** : statut, catégorie, date, score, votes
- **Vues** : grille ou liste, avec tri multi-colonnes

---

### 6.3 📊 Scoring & Évaluation

**Module :** `IdeaScoreRepository`, `IdeaScoreResponse`

#### Critères de scoring (chacun noté 1-10) :
| Critère | Description |
|---------|-------------|
| **Niveau d'Innovation** | Degré de nouveauté et d'originalité |
| **Faisabilité Technique** | Complexité et ressources nécessaires |
| **Alignement Stratégique** | Cohérence avec les objectifs de l'entreprise |
| **Potentiel ROI** | Retour sur investissement attendu |
| **Niveau de Risque** | Risques identifiés (inversé dans le score) |

**Score Total** = Moyenne pondérée des 5 critères

**Règle de validation** : Une idée passe à `SCOREE` quand le nombre minimum de scoreurs requis a évalué l'idée (configurable, défaut : 3).

---

### 6.4 🏆 Campagnes d'Innovation

**Module :** `CampaignController`, `CampaignService`

#### Fonctionnalités :
- **Création de campagnes** thématiques avec image, couleur, dates
- **Statuts** : À venir / Actif / Terminé
- **Barre de progression** temporelle (début → fin)
- **Association d'idées** : les porteurs peuvent soumettre dans une campagne
- **Clôture manuelle** par les managers
- **Vue détaillée** : liste des idées soumises dans la campagne
- **Filtres** : statut, catégorie, recherche textuelle

---

### 6.5 ✅ Approbation & Workflow

**Module :** `IdeaController` (workflow endpoint), `ApprobationPage`

#### Interface Kanban :
Chaque colonne représente un état du workflow :
```
[SOUMISE] → [EN_VALIDATION] → [SCOREE] → [APPROUVÉE_INNOVATION]
→ [APPROUVÉE_BU] → [APPROUVÉE_DG] → [EN_INCUBATION] → [CLÔTURÉE]
                                                    ↓
                                              [REJETÉE]
```

#### Actions disponibles selon le rôle :
- **RESPONSABLE_INNOVATION** : Valider → EN_VALIDATION, Approuver → APPROUVEE_INNOVATION, Rejeter
- **DIRECTEUR_BU** : Approuver → APPROUVEE_BU, Rejeter
- **DIRECTEUR_GENERAL** : Approuver → APPROUVEE_DG (→ crée automatiquement un projet), Rejeter

#### Panneau de détail (slide-over) :
- Informations complètes de l'idée
- Historique des scores avec détail par évaluateur
- Formulaire de scoring inline
- Boutons d'action contextuels
- Gestion de la deadline de scoring

---

### 6.6 🚀 Suivi de Projets

**Module :** `ProjectController`, `ProjectService`

#### Cycle de vie d'un projet :
```
EXPLORATION → CONCEPTUALISATION → PILOTE → MISE_A_ECHELLE → CLÔTURÉ
```

#### Onglets du panneau projet :

**📋 Livrables**
- Livrables organisés par étape
- Checkbox de complétion avec date et auteur
- Ajout de nouveaux livrables
- Progression globale de l'étape

**✅ Tâches**
- Tâches assignées aux membres de l'équipe
- Statuts : À faire / En cours / Terminée
- Filtrage par étape de projet
- Formulaire de création avec assignation et deadline

**👥 Équipe**
- Liste des membres avec leur rôle dans l'équipe
- Invitation de nouveaux membres (avec deadline de réponse)
- Modification du rôle d'un membre
- Suppression d'un membre

**💬 Chat**
- Messagerie temps réel via WebSocket (STOMP)
- Envoi de fichiers dans le chat
- Historique des messages paginé
- Affichage des messages avec avatar et horodatage

**📁 Documents**
- Upload de documents liés au projet
- Téléchargement des fichiers
- Affichage : nom, type, taille, uploadeur, date

**ℹ️ Détails**
- Informations générales du projet
- Avancement de l'étape (slider de progression)
- Passage à l'étape suivante
- Suppression du projet (DG uniquement)

---

### 6.7 📋 Mes Tâches

**Module :** `TaskController`, `tasksApi`

#### Fonctionnalités :
- Vue consolidée de toutes les tâches assignées à l'utilisateur connecté
- Changement de statut inline (À faire / En cours / Terminée)
- Panneau de détail avec description complète
- **Upload de documents** spécifiques à une tâche
- Téléchargement des pièces jointes
- Action "Marquer comme terminée" en un clic

---

### 6.8 📬 Mes Invitations

**Module :** `TeamInvitation`, `RespondInvitationRequest`

#### Fonctionnalités :
- Liste des invitations reçues pour rejoindre des équipes projet
- Statuts : En attente / Acceptée / Refusée / Expirée
- **Acceptation** avec message optionnel
- **Refus** avec message de justification
- Deadline de réponse visible
- Notifications temps réel via WebSocket à l'invitation
- Vue des invitations envoyées (pour les managers)

---

### 6.9 💬 Messagerie Projet

**Module :** `MessageController`, `ProjectMessageService`, `WebSocketBroadcastService`

#### Fonctionnalités :
- Sélection du projet parmi les projets accessibles
- **Chat temps réel** via WebSocket STOMP
- Envoi de messages texte
- **Envoi de fichiers** (images, documents)
- Historique paginé (50 messages par page)
- Distinction visuelle messages envoyés/reçus
- Affichage : nom expéditeur, heure, contenu

---

### 6.10 👥 Gestion des Utilisateurs

**Module :** `UserController`, `GestionUtilisateursPage`

#### Fonctionnalités (RESPONSABLE_INNOVATION uniquement) :
- **Liste complète** des utilisateurs avec recherche
- **Création d'utilisateur** : prénom, nom, email, mot de passe, rôle, BU, département
- **Modification du rôle** d'un utilisateur existant
- **Suppression** d'un utilisateur
- Affichage des points de gamification par utilisateur
- Badges colorés par rôle

---

### 6.11 🤖 Assistant IA (Chatbot)

**Module :** `ChatbotController`, `ChatbotWidget`

#### Fonctionnalités :
- Widget flottant accessible depuis toutes les pages
- **Suggestions rapides** : questions fréquentes pré-définies
- **Réponses contextuelles** sur la plateforme
- Rendu Markdown dans les réponses
- Historique de la conversation en session
- Indicateur "en cours de frappe"
- Badge de notification pour les réponses non lues

---

### 6.12 🔔 Notifications Temps Réel

**Module :** `NotificationController`, `NotificationService`, `WebSocketBroadcastService`

#### Déclencheurs de notifications :
| Événement | Destinataire |
|-----------|-------------|
| Idée soumise | Responsable Innovation |
| Idée passée en validation | Porteur de l'idée |
| Idée scorée | Porteur + RI |
| Idée approuvée/rejetée | Porteur de l'idée |
| Invitation à rejoindre un projet | Utilisateur invité |
| Tâche assignée | Utilisateur assigné |
| Message dans un projet | Membres du projet |
| Projet créé depuis une idée | Porteur de l'idée |

#### Interface :
- **Cloche** dans le header avec badge de comptage
- **Panel déroulant** avec liste des notifications
- Filtrage : Toutes / Non lues
- Actions : Marquer tout comme lu / Vider
- **Toast popup** pour les nouvelles notifications
- Redirection vers la page concernée au clic

---

### 6.13 📈 Tableau de Bord

**Module :** `DashboardController`, `DashboardService`

#### KPIs affichés :
- **Total Idées** soumises
- **Idées En cours** (en traitement)
- **Idées Validées** (approuvées)
- **Idées Déployées** (clôturées → projets)

#### Visualisations :
- **Pipeline d'Innovation** : barres horizontales par statut
- **Idées Récentes** : tableau avec titre, auteur, score, statut
- **Top Innovateurs** : classement par points de gamification
- **CTA** : bouton de soumission d'idée rapide

---

## 7. Workflow Principal — Cycle de Vie d'une Idée

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    WORKFLOW COMPLET D'UNE IDÉE                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PORTEUR D'IDÉE
     │
     │  1. Remplit le formulaire wizard (3 étapes)
     │  2. Attache des documents optionnels
     │  3. Choisit : Soumettre ou Sauvegarder en brouillon
     ▼
[BROUILLON] ──────────────────────────────────────────────────► [SOUMISE]
                                                                      │
                                                                      │ Notification → RI
                                                                      ▼
RESPONSABLE INNOVATION
     │
     │  Examine l'idée
     │  Option A : Valider (passer en révision)
     │  Option B : Rejeter directement
     ▼
[EN_VALIDATION] ──────────────────────────────────────────────► [REJETÉE]
     │
     │  RI définit une deadline de scoring
     │  RI + DBU + DG notent l'idée sur 5 critères
     │  Score calculé automatiquement
     ▼
[SCORÉE] (quand N évaluateurs ont noté)
     │
     │  RI examine le score consolidé
     │  Option A : Approuver → niveau 1
     │  Option B : Rejeter
     ▼
[APPROUVÉE_INNOVATION] ────────────────────────────────────────► [REJETÉE]
     │
     │  DIRECTEUR BU examine
     │  Option A : Approuver → niveau 2
     │  Option B : Rejeter
     ▼
[APPROUVÉE_BU] ────────────────────────────────────────────────► [REJETÉE]
     │
     │  DIRECTEUR GÉNÉRAL examine
     │  Option A : Approuver → niveau 3 (DÉCISION FINALE)
     │  Option B : Rejeter
     ▼
[APPROUVÉE_DG]
     │
     │  RI met l'idée en incubation
     │  RI crée le projet associé
     ▼
[EN_INCUBATION] ──────────────────────────────────────────────► Projet créé
     │
     │  Projet suit son propre cycle :
     │  EXPLORATION → CONCEPTUALISATION → PILOTE → MISE_A_ECHELLE
     ▼
[CLÔTURÉE] ═══════════════ Projet déployé avec succès ══════════════════════
```

---

## 8. Diagramme BPMN — Processus d'Innovation

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                         BPMN — PROCESSUS INNOVHUB                               ║
╚══════════════════════════════════════════════════════════════════════════════════╝

POOL : Entreprise
│
├── LANE : Porteur d'Idée
│   │
│   ○ [START] Idée identifiée
│   │
│   ├── [TASK] Remplir formulaire wizard
│   │         (titre, catégorie, problème, solution, ROI, coût)
│   │
│   ├── [TASK] Attacher documents (optionnel)
│   │
│   ├── ◇ [GATEWAY] Prêt à soumettre ?
│   │   ├── Non → [TASK] Sauvegarder brouillon → ○ [END INTERMÉDIAIRE]
│   │   └── Oui ↓
│   │
│   ├── [TASK] Soumettre l'idée
│   │
│   ├── [TASK] Recevoir notification de confirmation
│   │
│   └── ◇ [GATEWAY] Résultat final ?
│       ├── Approuvé → [TASK] Rejoindre équipe projet (si invité)
│       └── Rejeté → [TASK] Consulter motif de rejet → ○ [END]
│
├── LANE : Responsable Innovation
│   │
│   ├── [TASK] Recevoir notification nouvelle idée
│   │
│   ├── [TASK] Examiner l'idée (problème, solution, ROI)
│   │
│   ├── ◇ [GATEWAY] Idée recevable ?
│   │   ├── Non → [TASK] Rejeter avec commentaire → → → → → → → → → ↓
│   │   └── Oui ↓                                                     │
│   │                                                                  │
│   ├── [TASK] Passer en EN_VALIDATION                                │
│   │                                                                  │
│   ├── [TASK] Définir deadline de scoring                            │
│   │                                                                  │
│   ├── [TASK] Scorer l'idée (5 critères)                             │
│   │                                                                  │
│   ├── [TASK] Attendre N scores minimum                              │
│   │         (événement temporel)                                     │
│   │                                                                  │
│   ├── [TASK] Examiner score consolidé                               │
│   │                                                                  │
│   ├── ◇ [GATEWAY] Score suffisant ?                                 │
│   │   ├── Non → [TASK] Rejeter → → → → → → → → → → → → → → → → → ↓
│   │   └── Oui ↓                                                     │
│   │                                                                  │
│   ├── [TASK] Approuver (APPROUVEE_INNOVATION)                       │
│   │                                                                  │
│   └── [TASK] (Après DG) Créer projet en incubation                 │
│             Gérer équipe, tâches, livrables                          │
│                                                                      │
├── LANE : Directeur BU                                                │
│   │                                                                  │
│   ├── [TASK] Recevoir notification idée approuvée RI                │
│   │                                                                  │
│   ├── [TASK] Scorer l'idée (si pas encore fait)                     │
│   │                                                                  │
│   ├── [TASK] Examiner l'idée                                        │
│   │                                                                  │
│   └── ◇ [GATEWAY] Approuver ?                                       │
│       ├── Non → [TASK] Rejeter → → → → → → → → → → → → → → → → → ↓
│       └── Oui → [TASK] Approuver (APPROUVEE_BU)                     │
│                                                                      │
├── LANE : Directeur Général                                           │
│   │                                                                  │
│   ├── [TASK] Recevoir notification idée approuvée BU                │
│   │                                                                  │
│   ├── [TASK] Scorer l'idée (si pas encore fait)                     │
│   │                                                                  │
│   ├── [TASK] Examiner l'idée + scores + ROI                         │
│   │                                                                  │
│   └── ◇ [GATEWAY] Approuver ?                                       │
│       ├── Non → [TASK] Rejeter avec motif → → → → → → → → → → → → ↓
│       └── Oui → [TASK] Approuver (APPROUVEE_DG)                     │
│                         ↓                                            │
│               [TASK] Notifier porteur                                │
│                         ↓                                            │
│               ○ [END SUCCÈS]                                         │
│                                                                      │
└── [TASK] Notifier porteur du rejet ← ← ← ← ← ← ← ← ← ← ← ← ← ←
          ○ [END REJET]
```

---

## 9. Diagramme de Séquence — Soumission & Approbation

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              DIAGRAMME DE SÉQUENCE — SOUMISSION D'IDÉE                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

Porteur    Frontend    Backend API    Database    Notif Service    RI
   │           │            │             │             │           │
   │──Submit──►│            │             │             │           │
   │           │──POST /ideas──────────►  │             │           │
   │           │            │──INSERT idea►│             │           │
   │           │            │◄──idea_id───│             │           │
   │           │            │──trigger────►│             │           │
   │           │            │  (reference)│             │           │
   │           │            │──notify()───────────────► │           │
   │           │            │             │             │──WS push──►│
   │           │◄──201 OK───│             │             │           │
   │◄──Success─│            │             │             │           │
   │           │            │             │             │           │
   │──Upload doc►│           │             │             │           │
   │           │──POST /ideas/{id}/docs──►│             │           │
   │           │            │──store file─►│             │           │
   │           │◄──200 OK───│             │             │           │
   │◄──Uploaded│            │             │             │           │

╔══════════════════════════════════════════════════════════════════════════════╗
║              DIAGRAMME DE SÉQUENCE — SCORING & APPROBATION                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

RI         Frontend    Backend API    Database    Notif Service    Porteur
│           │            │             │             │               │
│──Score───►│            │             │             │               │
│           │──POST /ideas/{id}/score─►│             │               │
│           │            │──INSERT score►│            │               │
│           │            │──calc total──►│            │               │
│           │            │──check count─►│            │               │
│           │            │  (N scores?)  │            │               │
│           │            │──update status►│           │               │
│           │◄──200 OK───│             │             │               │
│           │            │             │             │               │
│──Approve─►│            │             │             │               │
│           │──POST /ideas/{id}/workflow►│            │               │
│           │            │──UPDATE status►│           │               │
│           │            │──notify()────────────────►│               │
│           │            │             │             │──WS push──────►│
│           │◄──200 OK───│             │             │               │
│◄──Success─│            │             │             │               │
```

---

## 10. Diagramme de Cas d'Utilisation

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    USE CASE DIAGRAM — INNOVHUB                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

                    ┌─────────────────────────────────────────┐
                    │              SYSTÈME INNOVHUB            │
                    │                                          │
  ┌──────────┐      │  ○ Soumettre une idée                   │
  │ PORTEUR  │──────┤  ○ Sauvegarder en brouillon             │
  │  D'IDÉE  │      │  ○ Voter sur une idée                   │
  └──────────┘      │  ○ Voir mes idées                       │
                    │  ○ Rejoindre un projet (invitation)      │
                    │  ○ Voir mes tâches                       │
                    │  ○ Uploader des documents                │
                    │  ○ Utiliser le chatbot IA                │
                    │  ○ Voir mes invitations                  │
                    │  ○ Consulter les campagnes               │
                    │                                          │
  ┌──────────────┐  │  ○ Scorer une idée                      │
  │  RESP.       │──┤  ○ Approuver/Rejeter (niv. 1)           │
  │  INNOVATION  │  │  ○ Gérer le workflow complet             │
  └──────────────┘  │  ○ Créer des campagnes                  │
                    │  ○ Créer/Gérer des projets               │
                    │  ○ Gérer les équipes projet              │
                    │  ○ Assigner des tâches                   │
                    │  ○ Gérer les utilisateurs                │
                    │  ○ Voir toutes les idées                 │
                    │  ○ Tableau de bord complet               │
                    │  ○ Messagerie projet                     │
                    │                                          │
  ┌──────────────┐  │  ○ Scorer une idée                      │
  │  DIRECTEUR   │──┤  ○ Approuver/Rejeter (niv. 2)           │
  │     BU       │  │  ○ Voir projets de sa BU                │
  └──────────────┘  │  ○ Messagerie projet                    │
                    │  ○ Tableau de bord                       │
                    │                                          │
  ┌──────────────┐  │  ○ Scorer une idée                      │
  │  DIRECTEUR   │──┤  ○ Approuver/Rejeter (niv. 3 - FINAL)  │
  │   GÉNÉRAL    │  │  ○ Vision globale tous projets           │
  └──────────────┘  │  ○ Supprimer des idées                  │
                    │  ○ Tableau de bord stratégique           │
                    │                                          │
                    └─────────────────────────────────────────┘
```

---

## 11. Architecture Applicative

### 11.1 Architecture Frontend (Next.js)

```
src/
├── app/                          # App Router Next.js 15
│   ├── layout.tsx                # Layout racine + AppShell
│   ├── globals.css               # Design system + animations
│   ├── page.tsx                  # Dashboard principal
│   ├── login/page.tsx            # Authentification
│   ├── soumettre/page.tsx        # Wizard soumission idée
│   ├── mes-idees/page.tsx        # Mes idées (grid/list)
│   ├── toutes-idees/page.tsx     # Toutes les idées (managers)
│   ├── campagnes/
│   │   ├── page.tsx              # Liste des campagnes
│   │   ├── creer/page.tsx        # Créer une campagne
│   │   └── [id]/page.tsx         # Détail campagne + idées
│   ├── approbation/page.tsx      # Kanban d'approbation
│   ├── suivi-projet/page.tsx     # Gestion projets (6 onglets)
│   ├── mes-taches/page.tsx       # Tâches assignées
│   ├── mes-invitations/page.tsx  # Invitations projet
│   ├── messagerie/page.tsx       # Chat projet temps réel
│   ├── gestion-utilisateurs/     # Admin utilisateurs
│   └── profil/page.tsx           # Profil utilisateur
│
├── components/
│   ├── AppShell.tsx              # Layout + Auth Guard
│   ├── Header.tsx                # Barre supérieure + notifs
│   ├── Sidebar.tsx               # Navigation latérale
│   ├── MobileBottomNav.tsx       # Navigation mobile
│   ├── ChatbotWidget.tsx         # Assistant IA flottant
│   └── ProjectChat.tsx           # Composant chat projet
│
├── context/
│   └── AuthContext.tsx           # État auth global (React Context)
│
└── lib/
    └── api.ts                    # Client HTTP + tous les endpoints
```

### 11.2 Architecture Backend (Spring Boot)

```
com.innovhub/
├── config/
│   ├── SecurityConfig.java       # JWT + CORS + Spring Security
│   ├── WebSocketConfig.java      # STOMP broker configuration
│   └── WebSocketAuthConfig.java  # Auth WebSocket via JWT
│
├── controller/                   # REST Controllers
│   ├── AuthController.java       # POST /auth/login, /refresh, /logout
│   ├── IdeaController.java       # CRUD idées + workflow + scoring
│   ├── CampaignController.java   # CRUD campagnes
│   ├── ProjectController.java    # Projets + équipes + tâches + messages
│   ├── TaskController.java       # Tâches utilisateur
│   ├── UserController.java       # Gestion utilisateurs
│   ├── NotificationController.java # Notifications
│   ├── DocumentController.java   # Téléchargement fichiers
│   ├── DashboardController.java  # Statistiques
│   ├── MessageController.java    # Messages projet
│   └── ChatbotController.java    # IA assistant
│
├── service/                      # Logique métier
│   ├── AuthService.java
│   ├── IdeaService.java
│   ├── CampaignService.java
│   ├── ProjectService.java
│   ├── NotificationService.java
│   ├── DocumentService.java
│   ├── DashboardService.java
│   ├── ProjectMessageService.java
│   └── WebSocketBroadcastService.java
│
├── entity/                       # Entités JPA
│   ├── User.java
│   ├── Idea.java
│   ├── IdeaScore.java
│   ├── Campaign.java
│   ├── Project.java
│   ├── ProjectTask.java
│   ├── ProjectTeamMember.java
│   ├── TeamInvitation.java
│   ├── ProjectMessage.java
│   └── Document.java
│
├── repository/                   # Spring Data JPA
├── dto/                          # Request/Response DTOs
├── security/                     # JwtUtil, JwtFilter
├── enums/                        # TaskStatus, InvitationStatus
└── exception/                    # GlobalExceptionHandler
```

---

## 12. API REST — Endpoints

### 12.1 Authentification

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/auth/login` | Connexion utilisateur | ❌ |
| POST | `/auth/refresh` | Rafraîchir le token | ❌ |
| POST | `/auth/logout` | Déconnexion | ✅ |

### 12.2 Idées

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/ideas` | Soumettre une idée | ✅ |
| GET | `/ideas` | Toutes les idées (managers) | ✅ |
| GET | `/ideas/mine` | Mes idées | ✅ |
| GET | `/ideas/{id}` | Détail d'une idée | ✅ |
| PUT | `/ideas/{id}` | Modifier une idée | ✅ |
| DELETE | `/ideas/{id}` | Supprimer une idée | ✅ DG |
| POST | `/ideas/{id}/score` | Scorer une idée | ✅ |
| POST | `/ideas/{id}/workflow` | Action workflow | ✅ |
| PATCH | `/ideas/{id}/scoring-deadline` | Définir deadline | ✅ |
| POST | `/ideas/{id}/vote` | Voter | ✅ |
| GET | `/ideas/{id}/documents` | Documents d'une idée | ✅ |
| POST | `/ideas/{id}/documents` | Upload document | ✅ |

### 12.3 Campagnes

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/campaigns` | Liste des campagnes | ✅ |
| POST | `/campaigns` | Créer une campagne | ✅ Manager |
| GET | `/campaigns/{id}` | Détail campagne | ✅ |
| GET | `/campaigns/{id}/ideas` | Idées d'une campagne | ✅ |
| PATCH | `/campaigns/{id}/close` | Clôturer | ✅ Manager |

### 12.4 Projets

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/projects` | Tous les projets | ✅ Manager |
| GET | `/projects/{id}` | Détail projet | ✅ |
| DELETE | `/projects/{id}` | Supprimer | ✅ DG |
| PATCH | `/projects/{id}/stage` | Avancer étape | ✅ |
| PATCH | `/projects/{id}/progress` | Mettre à jour % | ✅ |
| POST | `/projects/{id}/deliverables` | Ajouter livrable | ✅ |
| PATCH | `/projects/{id}/deliverables/{did}` | Toggle livrable | ✅ |
| GET | `/projects/{id}/tasks` | Tâches du projet | ✅ |
| POST | `/projects/{id}/tasks` | Créer tâche | ✅ |
| PATCH | `/projects/{id}/tasks/{tid}` | Modifier tâche | ✅ |
| DELETE | `/projects/{id}/tasks/{tid}` | Supprimer tâche | ✅ |
| GET | `/projects/{id}/team` | Équipe projet | ✅ |
| POST | `/projects/{id}/team` | Inviter membre | ✅ |
| GET | `/projects/{id}/messages` | Messages | ✅ |
| POST | `/projects/{id}/messages` | Envoyer message | ✅ |
| GET | `/projects/invitations/mine` | Mes invitations | ✅ |
| POST | `/projects/invitations/{id}/respond` | Répondre | ✅ |
| GET | `/projects/my-team` | Mes projets (membre) | ✅ |

### 12.5 Autres

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/dashboard/stats` | Statistiques | ✅ |
| GET | `/notifications` | Mes notifications | ✅ |
| GET | `/notifications/unread-count` | Compteur non lus | ✅ |
| PATCH | `/notifications/read-all` | Tout marquer lu | ✅ |
| DELETE | `/notifications` | Vider notifications | ✅ |
| GET | `/users` | Liste utilisateurs | ✅ RI |
| POST | `/users` | Créer utilisateur | ✅ RI |
| PATCH | `/users/{id}/role` | Changer rôle | ✅ RI |
| DELETE | `/users/{id}` | Supprimer | ✅ RI |
| GET | `/documents/{id}/download` | Télécharger fichier | ✅ |
| POST | `/chatbot` | Message chatbot | ✅ |
| GET | `/tasks/mine` | Mes tâches | ✅ |

### 12.6 WebSocket (STOMP)

| Topic | Direction | Description |
|-------|-----------|-------------|
| `/user/{id}/queue/notifications` | Server → Client | Nouvelles notifications |
| `/user/{id}/queue/invitations` | Server → Client | Nouvelles invitations |
| `/topic/project/{id}/messages` | Server → Client | Messages chat projet |

---

## 13. Résultats & Bénéfices Attendus

### 13.1 Bénéfices Organisationnels

| Avant Innov'Hub | Après Innov'Hub |
|----------------|-----------------|
| Idées perdues dans les emails | Toutes les idées centralisées et traçables |
| Chaque département innove en silo | Collaboration transversale facilitée |
| Pas de critères d'évaluation | Scoring objectif multi-critères |
| Décisions informelles | Workflow validé à 3 niveaux hiérarchiques |
| Aucune visibilité sur les projets | Dashboard temps réel pour tous les managers |
| Innovateurs non reconnus | Gamification avec points et classement |
| Délai d'évaluation : semaines | Délai d'évaluation : < 15 jours |

### 13.2 Indicateurs de Performance

```
AVANT                          APRÈS (estimé)
─────────────────────────────────────────────
Idées traitées/mois : ~5       → ~50 (+900%)
Délai moyen : 45 jours         → 12 jours (-73%)
Taux transformation : 2%       → 15% (+650%)
Visibilité managers : 0%       → 100%
Satisfaction collab : faible   → élevée
Doublons projets : fréquents   → quasi nuls
```

---

## 14. Roadmap & Évolutions

### Phase 1 — Actuelle ✅
- [x] Authentification JWT
- [x] Soumission et gestion d'idées
- [x] Workflow d'approbation multi-niveaux
- [x] Scoring multi-critères
- [x] Campagnes d'innovation
- [x] Gestion de projets avec équipes
- [x] Tâches et livrables
- [x] Messagerie temps réel
- [x] Notifications WebSocket
- [x] Chatbot IA
- [x] Gestion des utilisateurs
- [x] Dashboard avec KPIs

### Phase 2 — Court terme 🔄
- [ ] Scoring automatique par IA (analyse NLP de l'idée)
- [ ] Tableau de bord analytique avancé (graphiques Chart.js)
- [ ] Export PDF des rapports d'idées
- [ ] Intégration email (notifications par mail)
- [ ] Mode sombre complet
- [ ] Application mobile (React Native)

### Phase 3 — Moyen terme 📋
- [ ] Intégration SSO (LDAP/Active Directory)
- [ ] API publique pour intégrations tierces
- [ ] Module de mentoring (pairing innovateurs)
- [ ] Marketplace d'idées inter-entreprises
- [ ] Analytics prédictifs (ML sur le succès des idées)
- [ ] Intégration Jira/Trello pour la gestion de projets

---

## Conclusion

**Innov'Hub** représente une transformation profonde de la manière dont l'entreprise gère son capital intellectuel. En centralisant toutes les initiatives d'innovation — jusqu'ici dispersées dans chaque département — la plateforme crée un **écosystème d'innovation structuré, transparent et équitable**.

Le workflow multi-niveaux garantit que chaque idée est évaluée de manière objective, tandis que les outils de collaboration (chat, tâches, invitations) permettent de transformer les meilleures idées en projets concrets avec des équipes dédiées.

La gamification (points, classements) et les notifications temps réel créent un **engagement durable** des collaborateurs, transformant l'innovation de l'exception en une pratique quotidienne ancrée dans la culture d'entreprise.

---

*Rapport généré le 31 Mars 2026 — Innov'Hub v2.0*
