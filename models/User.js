// Importation du module mongoose
const mongoose = require("mongoose");

// Extraction des classes Schema et model du module mongoose
const { Schema, model } = mongoose;

// Définition du schéma de données pour l'utilisateur
const UserSchema = new Schema({
  // Champ pour le nom d'utilisateur, de type String, obligatoire, longueur minimale de 4 caractères, unique
  username: { type: String, required: true, min: 4, unique: true },

  // Champ pour le mot de passe, de type String, obligatoire
  password: { type: String, required: true },
});

// Création du modèle utilisateur à partir du schéma défini
const UserModel = model("User", UserSchema);

// Exportation du modèle pour une utilisation dans d'autres fichiers
module.exports = UserModel;
