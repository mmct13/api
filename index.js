// Import des modules nécessaires
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const User = require("./models/User");
const Post = require("./models/Post");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const uploadMiddleware = multer({ dest: "uploads/" });
const fs = require("fs");

// Définition du sel pour le chiffrement des mots de passe
const salt = bcrypt.genSaltSync(10);

// Clé secrète pour la génération des tokens JWT
const secret = "fzrr334ffre42fbfsbrr16vrfvrvcfrf33fvreer";

// Configuration du middleware CORS
app.use(cors({ credentials: true, origin: "https://mmctblog.web.app" }));

// Middleware pour traiter les requêtes au format JSON
app.use(express.json());

// Middleware pour parser les cookies
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));
// Connexion à la base de données MongoDB
mongoose.connect(
  "mongodb+srv://mmct13:mmct123C@cluster0.2o2dmhx.mongodb.net/?retryWrites=true&w=majority"
);

// Endpoint pour l'inscription d'un utilisateur
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    // Création d'un nouvel utilisateur avec le nom d'utilisateur et le mot de passe hashé
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    // Réponse avec les informations de l'utilisateur créé
    res.json(userDoc);
  } catch (e) {
    // En cas d'erreur, renvoyer une réponse avec le code d'erreur 400 et les détails de l'erreur
    res.status(400).json(e);
  }
});

// Endpoint pour la connexion d'un utilisateur
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  // Recherche de l'utilisateur dans la base de données par son nom d'utilisateur
  const userDoc = await User.findOne({ username });
  // Vérification du mot de passe
  const passOk = bcrypt.compareSync(password, userDoc.password);

  if (passOk) {
    // Si le mot de passe est correct, génération d'un token JWT
    jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
      if (err) throw err;
      // Stockage du token dans un cookie et envoi des informations de l'utilisateur connecté
      res.cookie("token", token).json({
        id: userDoc._id,
        username,
      });
    });
  } else {
    // En cas de mot de passe incorrect, renvoyer une réponse avec le code d'erreur 401
    res.status(401).json({ message: "Mot de passe incorrect" });
  }
});

// Endpoint pour obtenir le profil de l'utilisateur
app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  // Vérification du token JWT
  jwt.verify(token, secret, {}, (err, info) => {
    if (err) throw err;
    // Renvoi des informations du profil de l'utilisateur
    res.json(info);
  });
});

// Endpoint pour la déconnexion de l'utilisateur
app.post("/logout", (req, res) => {
  // Suppression du token en le remplaçant par une chaîne vide
  res.cookie("token", "").json("Déconnexion réussie");
});

app.post("/post", uploadMiddleware.single("file"), async (req, res) => {
  const { originalname, path } = req.file;
  const parts = originalname.split(".");
  const ext = parts[parts.length - 1];
  const newPath = path + "." + ext;
  fs.renameSync(path, newPath);

  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) throw err;

    const { title, summary, content } = req.body;
    const postDoc = await Post.create({
      title,
      summary,
      content,
      cover: newPath,
      author: info.id,
    });

    // Renvoi des informations du profil de l'utilisateur
    res.json(postDoc);
  });
});

app.get("/post", async (req, res) => {
  res.json(
    await Post.find()
      .populate("author", ["username"])
      .sort({ createdAt: -1 })
      .limit(20)
  );
});

app.get("/post/:id", async (req, res) => {
  const { id } = req.params;
  const postDoc = await Post.findById(id).populate("author", ["username"]);
  res.json(postDoc);
});

app.put("/post", uploadMiddleware.single("file"), async (req, res) => {
  let newPath = null;
  if (req.file) {
    const { originalname, path } = req.file;
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    newPath = path + "." + ext;
    fs.renameSync(path, newPath);
  }
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) throw err;
    const { id, title, summary, content } = req.body;
    const postDoc = await Post.findById(id);
    const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
    if (!isAuthor) {
      return res
        .status(400)
        .json("Vous n'avez pas le droit de modifier ce post");
    }
    await postDoc.updateOne({
      title,
      summary,
      content,
      cover: newPath ? newPath : postDoc.cover,
    });
    res.json(postDoc);
  });
});

app.delete("/post/:id", async (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) throw err;
    const { id } = req.params;
    const postDoc = await Post.findById(id);
    const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
    if (!isAuthor) {
      return res
        .status(400)
        .json("Vous n'avez pas le droit de supprimer ce post");
    }
    await postDoc.deleteOne();
    res.json("Post supprimé");
  });
});

// Lancement du serveur sur le port 3003
app.listen(3003);
