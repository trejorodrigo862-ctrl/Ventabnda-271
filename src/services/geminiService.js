import { GoogleGenAI } from "@google/genai";

// Aligned with @google/genai guidelines to use process.env.API_KEY directly and assume its availability.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// This function was incomplete. It defined a prompt but never made an API call.
// FIX: Completed the prompt, added the Gemini API call, error handling, and corrected the return logic.
export const getCoachingPlan = async (prompt, users, individualProgress, goals, storeProgress) => {
  if (!prompt.trim()) {
    return "Por favor, introduce un objetivo para empezar.";
  }

  const model = 'gemini-2.5-flash';
  
  const fullPrompt = `
    Eres un coach de ventas experto y estratega de negocios para un equipo minorista.
    Tu tono debe ser profesional, basado en datos y muy práctico.
    Basándote en los siguientes datos JSON, proporciona un plan de acción conciso y potente para ayudar al gerente a alcanzar su objetivo declarado.

    **Miembros del Equipo:**
    ${JSON.stringify(users, null, 2)}

    **Datos de Ventas Individuales del Mes Actual (de esta app):**
    ${JSON.stringify(individualProgress, null, 2)}

    **Metas Mensuales:**
    ${JSON.stringify(goals?.teamGoal, null, 2)}

    **Progreso Diario Agregado de la Tienda este Mes (ingresado manualmente):**
    ${JSON.stringify(storeProgress, null, 2)}

    **Objetivo del Gerente:**
    "${prompt}"

    Tu respuesta debe estar estructurada de la siguiente manera usando Markdown:

    **1. Perspectiva Clave:** Un resumen breve y de alto nivel de la situación y tu recomendación principal.
    **2. Fortalezas Clave a Aprovechar:** Identifica 2-3 tendencias positivas o áreas/individuos de alto rendimiento a partir de los datos.
    **3. Principales Oportunidades de Mejora:** Identifica 2-3 áreas que necesitan la mayor atención para alcanzar la meta.
    **4. Pasos a Seguir Accionables:** Proporciona un plan claro y paso a paso. Para cada paso, especifica QUIÉN debe hacerlo y QUÉ debe hacer. Sé específico y directo.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating coaching plan:", error);
    return "Hubo un error al generar el plan. Por favor, intente nuevamente.";
  }
};

// This function was missing, causing a critical error when loading the 'Informes' component.
// ADD: Implemented the missing function to generate a detailed report analysis using the Gemini API.
export const getDetailedReportAnalysis = async (users, goal, storeProgress, individualProgress) => {
    const model = 'gemini-2.5-flash';

    const fullPrompt = `
    Como analista de negocios profesional para una tienda minorista, tu tarea es generar un informe de rendimiento mensual completo. Tu tono debe ser formal, perspicaz y basado en datos.

    Basándote en los siguientes datos JSON del mes actual, proporciona un análisis detallado.

    **Miembros del Equipo:**
    ${JSON.stringify(users, null, 2)}

    **Metas Mensuales:**
    ${JSON.stringify(goal, null, 2)}

    **Progreso Diario Agregado de la Tienda (ingresado por el gerente):**
    ${JSON.stringify(storeProgress, null, 2)}

    **Datos de Ventas Individuales (ingresado por los vendedores en la app):**
    ${JSON.stringify(individualProgress, null, 2)}

    Tu informe debe estar estructurado de la siguiente manera usando Markdown:

    **1. Resumen de Rendimiento General:**
    - Resume brevemente el rendimiento general de la tienda frente a sus objetivos principales (Ingresos Totales, Unidades Totales, etc.).
    - Destaca los logros más significativos y las áreas que necesitan atención.

    **2. Análisis de Indicadores Clave de Rendimiento (KPIs):**
    - Analiza el rendimiento de métricas clave como Ticket Promedio, Unidades por Ticket y el rendimiento en categorías estratégicas (ej. Calzado, Crédito MC).
    - Compara los resultados reales con las metas donde sea aplicable.

    **3. Desglose del Rendimiento Individual:**
    - Proporciona una evaluación concisa de cada miembro del equipo (vendedores y cajeros), comparando sus resultados con sus metas individuales.
    - Identifica a los de mejor rendimiento y a los miembros que podrían necesitar apoyo.

    **4. Plan de Mejora Accionable:**
    - Basado en tu análisis, propón un plan claro, conciso y accionable con 3-4 recomendaciones clave.
    - Las sugerencias deben ser específicas y dirigidas a abordar las debilidades identificadas y aprovechar las fortalezas.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: fullPrompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating detailed report:", error);
        return "Hubo un error al generar el análisis. Por favor, intente nuevamente.";
    }
};
