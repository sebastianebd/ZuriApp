import { Request, Response } from "express";
import calendarService from "../services/calendar.service";

async function downloadIcs(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const icsContent = await calendarService.generateIcs(id);

    if (!icsContent) {
      return res.status(404).json({ message: "Reemplazo no encontrado" });
    }

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="reemplazo-${id}.ics"`,
    );

    res.send(icsContent);
  } catch (error: any) {
    console.error("Error generating ICS:", error);
    res.status(500).json({ message: "Error generando archivo de calendario" });
  }
}

async function viewEventPage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const host = req.get("host");
    const htmlContent = await calendarService.generateEventHtml(id, host);

    if (!htmlContent) {
      return res.status(404).send("<h1>Reemplazo no encontrado</h1>");
    }

    res.send(htmlContent);
  } catch (error: any) {
    res.status(500).send("Error interno");
  }
}

export default {
  downloadIcs,
  viewEventPage,
};

