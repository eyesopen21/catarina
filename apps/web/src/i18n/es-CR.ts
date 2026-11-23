const esCR = {
  app: {
    name: "Catarina",
    title: "Catarina | Inicio",
    skipToContent: "Saltar al contenido principal",
    workspace: "Espacio docente",
    locale: "Español (Costa Rica)",
  },
  demo: {
    label: "DEMO · Datos sintéticos",
    description: "El contenido es ficticio y no se guarda. No usés información de estudiantes ni datos personales.",
  },
  navigation: {
    label: "Secciones del espacio",
    home: "Inicio",
    plans: "Planeamientos",
    curriculum: "Currículo",
  },
  auth: {
    title: "Iniciar sesión con la institución",
    oidc: "OIDC · pendiente de integración",
  },
  home: {
    eyebrow: "TU ESPACIO DE TRABAJO",
    title: "Un buen plan empieza con una idea clara.",
    description: "Prepará, revisá y organizá tus planeamientos desde un solo lugar.",
    action: "Ver planeamientos",
    recent: "PLANEAMIENTO DE MUESTRA",
    recentDescription: "El editor y la conexión a IA se incorporarán en fases posteriores.",
    openPlan: "Abrir planeamiento",
    subjectLabels: { spanish: "Planeamiento de Español" },
    cycleLabels: { cycleI: "I ciclo · grupo de ejemplo" },
    stateLabels: { draft: "Borrador de ejemplo" },
  },
  pages: {
    plans: {
      eyebrow: "PLANEAMIENTOS",
      title: "Planeamientos",
      description: "Organizá tus ideas antes de convertirlas en una propuesta de clase.",
      status: "Editor pendiente de integración · WP-27",
      previewState: "Vista de planeamiento",
      emptyDescription: "La edición y el guardado se incorporarán al conectar el editor.",
    },
    curriculum: {
      eyebrow: "CURRÍCULO",
      title: "Fuentes y reglas curriculares",
      description: "Consultá la procedencia y el estado de validación de cada regla.",
      status: "Regla sin validar por especialistas",
      ruleStatus: "Regla sin validar",
      sourceName: "Fuente sintética de Español",
      sourceDetail: "Referencia ficticia para demostración · ciclo I",
      sourceSection: "Apartado de ejemplo: actividad y evidencia",
      validationTitle: "Validación incompleta",
      validationDescription: "La regla de muestra no fue revisada por especialistas y no representa una norma del MEP.",
    },
  },
} as const;

export default esCR;
