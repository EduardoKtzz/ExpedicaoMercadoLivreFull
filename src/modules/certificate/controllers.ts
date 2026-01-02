import { Request, Response } from "express";
import fs from "fs";
import crypto from "crypto";
import path from "path";

// ajuste o caminho se necessário
const privateKeyPath = path.resolve("C:/qz-certs/private-key.pem");
const privateKeyPem = fs.readFileSync(privateKeyPath, "utf8");

export function signQzRequest(req: Request, res: Response) {
  const toSign = String(req.query.request ?? "");

  if (!toSign) {
    return res.status(400).send("missing request");
  }

  try {
    const signer = crypto.createSign("RSA-SHA512");
    signer.update(toSign.trim(), "utf8");
    signer.end();

    const signatureB64 = signer.sign(privateKeyPem, "base64");

    res.type("text/plain").send(signatureB64);
    
  } catch (err) {
    console.error("QZ sign error:", err);
    res.status(500).send("signature error");
  }
}
