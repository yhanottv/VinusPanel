export interface DesignOptions {
    chart_shape: string;
    logo_mode: string;
    logo_light: string;
    logo_square: string;
    logo_alt: string;
    muted: string;
    raised: string;
    button_text: string;
    success: string;
    danger: string;
    warning: string;
    light_background: string;
    light_surface: string;
    light_text: string;
    light_muted: string;
    palette_picker: boolean;
    body_font: string;
    heading_font: string;
    mono_font: string;
    font_size: number;
    default_language: string;
    language_picker: boolean;
    icon_family: string;
    icon_size: number;
    icon_style: string;
    icon_weight: number;
    radius: number;
    border: string;
    input_border: boolean;
    shadow: string;
    card_opacity: number;
    page_opacity: number;
    content_width: string;
    sidebar_style: string;
    solid_sidebar: boolean;
    active_link: string;
    account_block: boolean;
    topbar_search: boolean;
    search_style: string;
    footer_credit: boolean;
    footer_theme: boolean;
    footer_text: string;
    account_links: boolean;
    community_links: boolean;
    login_layout: string;
    login_surface: string;
    login_align: string;
    login_width: number;
    login_backdrop: string;
    login_logo: boolean;
    login_pitch: boolean;
    login_heading: string;
    login_description: string;
    login_footnote: string;
    server_view: string;
    row_artwork: boolean;
    quick_cards: boolean;
    recent_activity: boolean;
    welcome_notice: boolean;
    notice_title: string;
    notice_message: string;
    notice_style: string;
    server_nav: string;
    server_inset: boolean;
    server_logo: boolean;
    server_header: boolean;
    server_address: boolean;
    blur_address: boolean;
    overview_resources: boolean;
    overview_info: boolean;
    power_style: string;
    power_joined: boolean;
    console_usage: string;
    console_charts: string;
    console_address: boolean;
    console_empty: boolean;
    console_prompt: string;
    console_daemon: string;
    console_font_size: number;
    button_motion: string;
    page_motion: string;
    motion_duration: number;
    title_template: string;
    description: string;
    favicon: string;
    social_image: string;
}
export interface DesignField { category: string; key: keyof DesignOptions; label: string; default: string | number | boolean; kind: string; choices?: {value:string; label:string}[]; min?: number; max?: number }
export const designFields: DesignField[] = [
{"category": "icons", "key": "icon_family", "label": "Famille des icônes", "default": "outline", "kind": "select", "choices": [{"value": "outline", "label": "Vinus · contours"}, {"value": "lucide", "label": "Lucide"}, {"value": "tabler", "label": "Tabler"}, {"value": "solid", "label": "Font Awesome · pleines"}]},
{"category": "icons", "key": "icon_size", "label": "Taille des icônes (px)", "default": 18, "kind": "range", "min": 14, "max": 28},
 { category:"console",key:"chart_shape",label:"Forme des graphiques",default:"line",kind:"select",choices:[{value:"line",label:"Courbes"},{value:"bar",label:"Barres"}] },
  {
    "category": "brand",
    "key": "logo_mode",
    "label": "Mode du logo",
    "default": "both",
    "kind": "select",
    "choices": [
      {
        "value": "art",
        "label": "Image seule"
      },
      {
        "value": "text",
        "label": "Texte seul"
      },
      {
        "value": "both",
        "label": "Image et texte"
      }
    ]
  },
  {
    "category": "brand",
    "key": "logo_light",
    "label": "Logo du thème clair",
    "default": "",
    "kind": "image"
  },
  {
    "category": "brand",
    "key": "logo_square",
    "label": "Logo carré",
    "default": "",
    "kind": "image"
  },
  {
    "category": "brand",
    "key": "logo_alt",
    "label": "Texte alternatif",
    "default": "VinusPanel",
    "kind": "text"
  },
  {
    "category": "colour",
    "key": "muted",
    "label": "Texte secondaire",
    "default": "#9ba3b1",
    "kind": "color"
  },
  {
    "category": "colour",
    "key": "raised",
    "label": "Surface surélevée",
    "default": "#171b23",
    "kind": "color"
  },
  {
    "category": "colour",
    "key": "button_text",
    "label": "Texte des boutons",
    "default": "#071824",
    "kind": "color"
  },
  {
    "category": "colour",
    "key": "success",
    "label": "Succès",
    "default": "#43d6a3",
    "kind": "color"
  },
  {
    "category": "colour",
    "key": "danger",
    "label": "Erreur",
    "default": "#fb7185",
    "kind": "color"
  },
  {
    "category": "colour",
    "key": "warning",
    "label": "Avertissement",
    "default": "#fbbf24",
    "kind": "color"
  },
  {
    "category": "colour",
    "key": "light_background",
    "label": "Fond clair",
    "default": "#f6f8fc",
    "kind": "color"
  },
  {
    "category": "colour",
    "key": "light_surface",
    "label": "Cartes claires",
    "default": "#ffffff",
    "kind": "color"
  },
  {
    "category": "colour",
    "key": "light_text",
    "label": "Texte clair",
    "default": "#202b3e",
    "kind": "color"
  },
  {
    "category": "colour",
    "key": "light_muted",
    "label": "Texte secondaire clair",
    "default": "#586579",
    "kind": "color"
  },
  {
    "category": "colour",
    "key": "palette_picker",
    "label": "Laisser les utilisateurs choisir leur accent",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "type",
    "key": "body_font",
    "label": "Police du texte",
    "default": "montserrat",
    "kind": "select",
    "choices": [
      {
        "value": "system",
        "label": "Système"
      },
      {
        "value": "montserrat",
        "label": "Montserrat"
      },
      {
        "value": "arial",
        "label": "Arial"
      },
      {
        "value": "georgia",
        "label": "Georgia"
      },
      {
        "value": "mono",
        "label": "Monospace"
      }
    ]
  },
  {
    "category": "type",
    "key": "heading_font",
    "label": "Police des titres",
    "default": "montserrat",
    "kind": "select",
    "choices": [
      {
        "value": "system",
        "label": "Système"
      },
      {
        "value": "montserrat",
        "label": "Montserrat"
      },
      {
        "value": "arial",
        "label": "Arial"
      },
      {
        "value": "georgia",
        "label": "Georgia"
      },
      {
        "value": "mono",
        "label": "Monospace"
      }
    ]
  },
  {
    "category": "type",
    "key": "mono_font",
    "label": "Police de la console",
    "default": "system",
    "kind": "select",
    "choices": [
      {
        "value": "system",
        "label": "Monospace système"
      },
      {
        "value": "consolas",
        "label": "Consolas"
      },
      {
        "value": "courier",
        "label": "Courier New"
      }
    ]
  },
  {
    "category": "type",
    "key": "font_size",
    "label": "Taille du texte",
    "default": 14,
    "kind": "range",
    "min": 12,
    "max": 18
  },
  {
    "category": "language",
    "key": "default_language",
    "label": "Langue par défaut",
    "default": "fr",
    "kind": "select",
    "choices": [{"value": "fr", "label": "Français"}, {"value": "en", "label": "English"}, {"value": "de", "label": "Deutsch"}, {"value": "es", "label": "Español"}, {"value": "it", "label": "Italiano"}, {"value": "pt", "label": "Português"}, {"value": "nl", "label": "Nederlands"}, {"value": "tr", "label": "Türkçe"}]
  },
  {
    "category": "language",
    "key": "language_picker",
    "label": "Afficher le sélecteur de langue",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "icons",
    "key": "icon_style",
    "label": "Style des icônes",
    "default": "round",
    "kind": "select",
    "choices": [
      {
        "value": "round",
        "label": "Arrondi"
      },
      {
        "value": "sharp",
        "label": "Angulaire"
      }
    ]
  },
  {
    "category": "icons",
    "key": "icon_weight",
    "label": "Épaisseur des icônes",
    "default": 15,
    "kind": "range",
    "min": 10,
    "max": 30
  },
  {
    "category": "surface",
    "key": "radius",
    "label": "Arrondi des cartes",
    "default": 14,
    "kind": "range",
    "min": 0,
    "max": 28
  },
  {
    "category": "surface",
    "key": "border",
    "label": "Bordures",
    "default": "subtle",
    "kind": "select",
    "choices": [
      {
        "value": "none",
        "label": "Aucune"
      },
      {
        "value": "subtle",
        "label": "Discrètes"
      },
      {
        "value": "strong",
        "label": "Marquées"
      },
      {
        "value": "accent",
        "label": "Accent"
      }
    ]
  },
  {
    "category": "surface",
    "key": "input_border",
    "label": "Bordures des champs",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "surface",
    "key": "shadow",
    "label": "Ombres",
    "default": "none",
    "kind": "select",
    "choices": [
      {
        "value": "none",
        "label": "Aucune"
      },
      {
        "value": "soft",
        "label": "Légères"
      },
      {
        "value": "deep",
        "label": "Profondes"
      }
    ]
  },
  {
    "category": "surface",
    "key": "card_opacity",
    "label": "Opacité des cartes",
    "default": 100,
    "kind": "range",
    "min": 30,
    "max": 100
  },
  {
    "category": "surface",
    "key": "page_opacity",
    "label": "Opacité de la page",
    "default": 100,
    "kind": "range",
    "min": 30,
    "max": 100
  },
  {
    "category": "layout",
    "key": "content_width",
    "label": "Largeur du contenu",
    "default": "full",
    "kind": "select",
    "choices": [
      {
        "value": "contained",
        "label": "Contenue"
      },
      {
        "value": "wide",
        "label": "Large"
      },
      {
        "value": "full",
        "label": "Pleine largeur"
      }
    ]
  },
  {
    "category": "layout",
    "key": "sidebar_style",
    "label": "Disposition de la barre latérale",
    "default": "classic",
    "kind": "select",
    "choices": [
      {
        "value": "classic",
        "label": "Classique"
      },
      {
        "value": "floating",
        "label": "Flottante"
      },
      {
        "value": "compact",
        "label": "Compacte"
      },
      {
        "value": "rail",
        "label": "Rail d’icônes"
      },
      {
        "value": "bordered",
        "label": "Bordure"
      }
    ]
  },
  {
    "category": "layout",
    "key": "solid_sidebar",
    "label": "Barre latérale opaque",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "layout",
    "key": "active_link",
    "label": "Lien actif",
    "default": "pill",
    "kind": "select",
    "choices": [
      {
        "value": "edge",
        "label": "Trait latéral"
      },
      {
        "value": "pill",
        "label": "Pilule"
      },
      {
        "value": "glow",
        "label": "Lueur"
      },
      {
        "value": "underline",
        "label": "Souligné"
      },
      {
        "value": "solid",
        "label": "Accent plein"
      },
      {
        "value": "dot",
        "label": "Point"
      },
      {
        "value": "fade",
        "label": "Dégradé"
      }
    ]
  },
  {
    "category": "layout",
    "key": "account_block",
    "label": "Compte au bas de la barre",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "layout",
    "key": "topbar_search",
    "label": "Recherche dans la barre supérieure",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "layout",
    "key": "search_style",
    "label": "Style de la recherche",
    "default": "inline",
    "kind": "select",
    "choices": [
      {
        "value": "inline",
        "label": "Champ"
      },
      {
        "value": "pill",
        "label": "Pilule"
      },
      {
        "value": "full",
        "label": "Pleine largeur"
      }
    ]
  },
  {
    "category": "layout",
    "key": "footer_credit",
    "label": "Crédit Pterodactyl",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "layout",
    "key": "footer_theme",
    "label": "Crédit VinusPanel",
    "default": false,
    "kind": "toggle"
  },
  {
    "category": "layout",
    "key": "footer_text",
    "label": "Texte du pied de page",
    "default": "",
    "kind": "text"
  },
  {
    "category": "navigation",
    "key": "account_links",
    "label": "Afficher les liens du compte",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "navigation",
    "key": "community_links",
    "label": "Afficher les liens communautaires",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "signin",
    "key": "login_layout",
    "label": "Disposition",
    "default": "left",
    "kind": "select",
    "choices": [
      {
        "value": "right",
        "label": "Formulaire à droite"
      },
      {
        "value": "left",
        "label": "Formulaire à gauche"
      },
      {
        "value": "center",
        "label": "Centré"
      },
      {
        "value": "top",
        "label": "Texte au-dessus"
      }
    ]
  },
  {
    "category": "signin",
    "key": "login_surface",
    "label": "Surface du formulaire",
    "default": "none",
    "kind": "select",
    "choices": [
      {
        "value": "none",
        "label": "Aucune"
      },
      {
        "value": "card",
        "label": "Carte"
      },
      {
        "value": "glass",
        "label": "Verre"
      },
      {
        "value": "outline",
        "label": "Contour"
      },
      {
        "value": "raised",
        "label": "Surélevée"
      }
    ]
  },
  {
    "category": "signin",
    "key": "login_align",
    "label": "Alignement du texte",
    "default": "left",
    "kind": "select",
    "choices": [
      {
        "value": "left",
        "label": "Gauche"
      },
      {
        "value": "center",
        "label": "Centré"
      }
    ]
  },
  {
    "category": "signin",
    "key": "login_width",
    "label": "Largeur du formulaire",
    "default": 448,
    "kind": "range",
    "min": 320,
    "max": 600
  },
  {
    "category": "signin",
    "key": "login_backdrop",
    "label": "Arrière-plan",
    "default": "games",
    "kind": "select",
    "choices": [
      {"value":"games","label":"Mosaïque de jeux"},
      {
        "value": "flat",
        "label": "Uni"
      },
      {
        "value": "image",
        "label": "Image du panel"
      },
      {
        "value": "gradient",
        "label": "Dégradé"
      },
      {
        "value": "aurora",
        "label": "Aurore"
      },
      {
        "value": "grid",
        "label": "Grille"
      }
    ]
  },
  {
    "category": "signin",
    "key": "login_logo",
    "label": "Afficher le logo",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "signin",
    "key": "login_pitch",
    "label": "Afficher le texte de présentation",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "signin",
    "key": "login_heading",
    "label": "Titre de présentation",
    "default": "",
    "kind": "text"
  },
  {
    "category": "signin",
    "key": "login_description",
    "label": "Texte de présentation",
    "default": "",
    "kind": "textarea"
  },
  {
    "category": "signin",
    "key": "login_footnote",
    "label": "Note en bas de page",
    "default": "",
    "kind": "text"
  },
  {
    "category": "dashboard",
    "key": "server_view",
    "label": "Affichage des serveurs par défaut",
    "default": "list",
    "kind": "select",
    "choices": [
      {
        "value": "list",
        "label": "Lignes"
      },
      {
        "value": "grid",
        "label": "Cartes"
      }
    ]
  },
  {
    "category": "dashboard",
    "key": "row_artwork",
    "label": "Afficher les bannières des serveurs",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "dashboard",
    "key": "quick_cards",
    "label": "Cartes de raccourcis",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "dashboard",
    "key": "recent_activity",
    "label": "Activité récente",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "dashboard",
    "key": "welcome_notice",
    "label": "Annonce de bienvenue",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "dashboard",
    "key": "notice_title",
    "label": "Titre de l’annonce",
    "default": "",
    "kind": "text"
  },
  {
    "category": "dashboard",
    "key": "notice_message",
    "label": "Message de l’annonce",
    "default": "",
    "kind": "textarea"
  },
  {
    "category": "dashboard",
    "key": "notice_style",
    "label": "Style de l’annonce",
    "default": "tinted",
    "kind": "select",
    "choices": [
      {
        "value": "tinted",
        "label": "Teinté"
      },
      {
        "value": "edge",
        "label": "Trait latéral"
      },
      {
        "value": "outline",
        "label": "Contour"
      },
      {
        "value": "plain",
        "label": "Simple"
      }
    ]
  },
  {
    "category": "server",
    "key": "server_nav",
    "label": "Navigation du serveur",
    "default": "replace",
    "kind": "select",
    "choices": [
      {
        "value": "replace",
        "label": "Barre principale"
      },
      {
        "value": "second",
        "label": "Seconde colonne"
      },
      {
        "value": "top",
        "label": "Au-dessus du contenu"
      }
    ]
  },
  {
    "category": "server",
    "key": "server_inset",
    "label": "Espacement du contenu",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "server",
    "key": "server_logo",
    "label": "Logo dans la navigation serveur",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "server",
    "key": "server_header",
    "label": "Bannière d’en-tête",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "server",
    "key": "server_address",
    "label": "Adresse dans la navigation",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "server",
    "key": "blur_address",
    "label": "Masquer les adresses jusqu’au survol",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "server",
    "key": "overview_resources",
    "label": "Ressources dans l’aperçu",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "server",
    "key": "overview_info",
    "label": "Informations dans l’aperçu",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "server",
    "key": "power_style",
    "label": "Style des boutons d’alimentation",
    "default": "accent",
    "kind": "select",
    "choices": [
      {
        "value": "accent",
        "label": "Accent"
      },
      {
        "value": "status",
        "label": "Couleurs des états"
      },
      {
        "value": "outline",
        "label": "Contour"
      }
    ]
  },
  {
    "category": "server",
    "key": "power_joined",
    "label": "Grouper les boutons d’alimentation",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "console",
    "key": "console_usage",
    "label": "Position des ressources",
    "default": "right",
    "kind": "select",
    "choices": [
      {
        "value": "right",
        "label": "À droite"
      },
      {
        "value": "left",
        "label": "À gauche"
      },
      {
        "value": "above",
        "label": "Au-dessus"
      },
      {
        "value": "below",
        "label": "En dessous"
      }
    ]
  },
  {
    "category": "console",
    "key": "console_charts",
    "label": "Position des graphiques",
    "default": "below",
    "kind": "select",
    "choices": [
      {
        "value": "none",
        "label": "Masqués"
      },
      {
        "value": "above",
        "label": "Au-dessus"
      },
      {
        "value": "below",
        "label": "En dessous"
      }
    ]
  },
  {
    "category": "console",
    "key": "console_address",
    "label": "Carte de connexion",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "console",
    "key": "console_empty",
    "label": "Message de console vide",
    "default": true,
    "kind": "toggle"
  },
  {
    "category": "console",
    "key": "console_prompt",
    "label": "Invite de commande",
    "default": "»",
    "kind": "text"
  },
  {
    "category": "console",
    "key": "console_daemon",
    "label": "Nom affiché du daemon",
    "default": "Pterodactyl Daemon",
    "kind": "text"
  },
  {
    "category": "console",
    "key": "console_font_size",
    "label": "Taille du texte de la console",
    "default": 12,
    "kind": "range",
    "min": 10,
    "max": 20
  },
  {
    "category": "motion",
    "key": "button_motion",
    "label": "Animation des boutons",
    "default": "none",
    "kind": "select",
    "choices": [
      {
        "value": "none",
        "label": "Aucune"
      },
      {
        "value": "press",
        "label": "Pression"
      },
      {
        "value": "lift",
        "label": "Élévation"
      },
      {
        "value": "glint",
        "label": "Reflet"
      },
      {
        "value": "pulse",
        "label": "Pulsation"
      },
      {
        "value": "grow",
        "label": "Agrandissement"
      }
    ]
  },
  {
    "category": "motion",
    "key": "page_motion",
    "label": "Animation d’entrée",
    "default": "fade",
    "kind": "select",
    "choices": [
      {
        "value": "none",
        "label": "Aucune"
      },
      {
        "value": "fade",
        "label": "Fondu"
      },
      {
        "value": "rise",
        "label": "Montée"
      },
      {
        "value": "slide",
        "label": "Glissement"
      },
      {
        "value": "scale",
        "label": "Zoom"
      }
    ]
  },
  {
    "category": "motion",
    "key": "motion_duration",
    "label": "Durée des animations",
    "default": 180,
    "kind": "range",
    "min": 0,
    "max": 600
  },
  {
    "category": "seo",
    "key": "title_template",
    "label": "Titre de page",
    "default": "{page} | {panel}",
    "kind": "text"
  },
  {
    "category": "seo",
    "key": "description",
    "label": "Description du panel",
    "default": "",
    "kind": "textarea"
  },
  {
    "category": "seo",
    "key": "favicon",
    "label": "Favicon",
    "default": "",
    "kind": "image"
  },
  {
    "category": "seo",
    "key": "social_image",
    "label": "Image de partage",
    "default": "",
    "kind": "image"
  }
];
export const optionDefaults: DesignOptions = {
 "chart_shape":"line",
  "logo_mode": "both",
  "logo_light": "",
  "logo_square": "",
  "logo_alt": "VinusPanel",
  "muted": "#9ba3b1",
  "raised": "#171b23",
  "button_text": "#071824",
  "success": "#43d6a3",
  "danger": "#fb7185",
  "warning": "#fbbf24",
  "light_background": "#f6f8fc",
  "light_surface": "#ffffff",
  "light_text": "#202b3e",
  "light_muted": "#586579",
  "palette_picker": true,
  "body_font": "montserrat",
  "heading_font": "montserrat",
  "mono_font": "system",
  "font_size": 14,
  "default_language": "fr",
  "language_picker": true,
  "icon_family": "outline",
  "icon_size": 18,
  "icon_style": "round",
  "icon_weight": 15,
  "radius": 14,
  "border": "subtle",
  "input_border": true,
  "shadow": "none",
  "card_opacity": 100,
  "page_opacity": 100,
  "content_width": "full",
  "sidebar_style": "classic",
  "solid_sidebar": true,
  "active_link": "pill",
  "account_block": true,
  "topbar_search": true,
  "search_style": "inline",
  "footer_credit": true,
  "footer_theme": false,
  "footer_text": "",
  "account_links": true,
  "community_links": true,
  "login_layout": "left",
  "login_surface": "none",
  "login_align": "left",
  "login_width": 448,
  "login_backdrop": "games",
  "login_logo": true,
  "login_pitch": true,
  "login_heading": "",
  "login_description": "",
  "login_footnote": "",
  "server_view": "list",
  "row_artwork": true,
  "quick_cards": true,
  "recent_activity": true,
  "welcome_notice": true,
  "notice_title": "",
  "notice_message": "",
  "notice_style": "tinted",
  "server_nav": "replace",
  "server_inset": true,
  "server_logo": true,
  "server_header": true,
  "server_address": true,
  "blur_address": true,
  "overview_resources": true,
  "overview_info": true,
  "power_style": "accent",
  "power_joined": true,
  "console_usage": "right",
  "console_charts": "below",
  "console_address": true,
  "console_empty": true,
  "console_prompt": "»",
  "console_daemon": "Pterodactyl Daemon",
  "console_font_size": 12,
  "button_motion": "none",
  "page_motion": "fade",
  "motion_duration": 180,
  "title_template": "{page} | {panel}",
  "description": "",
  "favicon": "",
  "social_image": ""
};
