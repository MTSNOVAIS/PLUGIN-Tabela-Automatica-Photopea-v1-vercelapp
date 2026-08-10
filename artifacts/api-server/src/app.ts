import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        // Uso seguro do WHATWG URL para evitar qualquer alerta de url.parse() interno
        let cleanUrl = req.url;
        try {
          if (req.url) {
            const parsed = new URL(req.url, `http://${req.headers?.host || "localhost"}`);
            cleanUrl = parsed.pathname;
          }
        } catch {
          cleanUrl = req.url?.split("?")[0];
        }

        return {
          id: req.id,
          method: req.method,
          url: cleanUrl,
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
