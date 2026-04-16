package com.innovhub.controller;

import com.innovhub.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private static final List<Entry> KB = List.of(
        e(List.of("soumettre", "proposer", "nouvelle idée", "créer idée", "idée"),
          "Pour soumettre une idée, rendez-vous sur la page **Soumettre** dans le menu latéral. "
          + "Remplissez le titre, la problématique, la solution proposée et choisissez une catégorie. "
          + "Vous pouvez aussi joindre des documents et l'associer à une campagne."),

        e(List.of("campagne", "campagnes", "défi", "challenge"),
          "Les campagnes sont des défis d'innovation lancés par les responsables. "
          + "Consultez la page **Campagnes** pour voir les défis actifs et y soumettre vos idées."),

        e(List.of("score", "notation", "évaluer", "évaluation", "scoring"),
          "Chaque idée soumise est évaluée par 3 Responsables Innovation sur 5 critères : "
          + "innovation, faisabilité technique, alignement stratégique, ROI potentiel et niveau de risque. "
          + "Le score moyen détermine si l'idée avance dans le processus."),

        e(List.of("workflow", "processus", "étape", "validation", "approbation"),
          "Le workflow d'une idée passe par : Brouillon → Soumise → En validation → Scorée → "
          + "Approuvée Innovation → Approuvée BU → Approuvée DG → En incubation → Clôturée. "
          + "À chaque étape, un rôle spécifique valide l'idée."),

        e(List.of("projet", "suivi", "incubation", "mise à l'échelle"),
          "Quand une idée est clôturée positivement, un projet est créé automatiquement. "
          + "Il passe par 4 étapes : Exploration, Conceptualisation, Pilote, et Mise à l'échelle. "
          + "Suivez la progression dans **Suivi Projets**."),

        e(List.of("équipe", "team", "membre", "collaborateur"),
          "Le Responsable Innovation peut constituer une équipe pour chaque projet via l'onglet **Équipe** "
          + "dans le détail du projet. Il peut ajouter des membres, leur attribuer un rôle et les retirer."),

        e(List.of("tâche", "taches", "task", "assigner"),
          "Les tâches sont créées par le Responsable Innovation dans chaque étape d'un projet. "
          + "Elles peuvent être assignées à un membre de l'équipe. Statuts : À faire, En cours, Terminée."),

        e(List.of("document", "fichier", "upload", "télécharger", "pièce jointe"),
          "Vous pouvez joindre des documents aux idées, projets et tâches. "
          + "Formats acceptés : PDF, images, Word, Excel. Taille max : 10 MB par fichier."),

        e(List.of("notification", "alerte", "notif"),
          "Vous recevez des notifications pour : nouvelles idées, validations, rejets, assignations de tâches, "
          + "avancement de projets. Consultez l'icône 🔔 dans le header."),

        e(List.of("rôle", "roles", "permission", "accès"),
          "Il y a 4 rôles : **Porteur d'idée** (soumet des idées), **Responsable Innovation** (gère tout le processus), "
          + "**Directeur BU** (approuve au niveau business unit), **Directeur Général** (approbation finale)."),

        e(List.of("profil", "mon compte", "mot de passe", "email"),
          "Consultez votre profil via le menu utilisateur en haut à droite. "
          + "Vous y trouverez vos informations, vos points et vos statistiques."),

        e(List.of("livrable", "deliverable", "checklist"),
          "Les livrables sont des éléments à compléter dans chaque étape d'un projet. "
          + "Le Responsable Innovation les crée, et tout membre peut les cocher une fois terminés."),

        e(List.of("point", "gamification", "récompense"),
          "Le système de points récompense la participation : soumission d'idées, validations, tâches terminées. "
          + "Consultez vos points dans votre profil."),

        e(List.of("utilisateur", "compte", "créer compte", "gestion utilisateur"),
          "La gestion des utilisateurs est réservée au Responsable Innovation. "
          + "Il peut créer des comptes, attribuer des rôles et désactiver des utilisateurs depuis **Utilisateurs**."),

        e(List.of("bonjour", "salut", "hello", "hi", "bonsoir", "coucou"),
          "Bonjour ! 👋 Je suis l'assistant InnovHub. Comment puis-je vous aider ? "
          + "Posez-moi une question sur les idées, campagnes, projets, tâches ou n'importe quelle fonctionnalité."),

        e(List.of("merci", "thanks"),
          "De rien ! N'hésitez pas si vous avez d'autres questions. 😊"),

        e(List.of("aide", "help", "comment ça marche", "fonctionnalité"),
          "Je peux vous aider avec :\n"
          + "• **Soumettre une idée** — comment proposer vos innovations\n"
          + "• **Campagnes** — les défis d'innovation actifs\n"
          + "• **Workflow** — le processus de validation des idées\n"
          + "• **Projets** — le suivi des projets d'incubation\n"
          + "• **Équipe** — la gestion des équipes projet\n"
          + "• **Tâches** — l'assignation et le suivi des tâches\n"
          + "• **Rôles** — les permissions par rôle\n"
          + "Tapez un mot-clé pour en savoir plus !")
    );

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, String>>> chat(@RequestBody Map<String, String> body) {
        String message = body.getOrDefault("message", "").toLowerCase().trim();
        if (message.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.ok(Map.of("reply",
                "Posez-moi une question sur InnovHub ! Par exemple : « Comment soumettre une idée ? »")));
        }

        String best = null;
        int bestScore = 0;

        for (Entry entry : KB) {
            int score = 0;
            for (String kw : entry.keywords) {
                if (message.contains(kw)) {
                    score += kw.length();
                }
            }
            if (score > bestScore) {
                bestScore = score;
                best = entry.answer;
            }
        }

        if (best == null) {
            best = "Je ne suis pas sûr de comprendre votre question. 🤔\n\n"
                 + "Essayez de me demander :\n"
                 + "• Comment soumettre une idée ?\n"
                 + "• Quel est le workflow de validation ?\n"
                 + "• Comment fonctionne le suivi des projets ?\n"
                 + "• Quels sont les rôles disponibles ?\n\n"
                 + "Tapez **aide** pour voir toutes les options.";
        }

        return ResponseEntity.ok(ApiResponse.ok(Map.of("reply", best)));
    }

    private static Entry e(List<String> kw, String answer) {
        return new Entry(kw, answer);
    }

    private record Entry(List<String> keywords, String answer) {}
}
