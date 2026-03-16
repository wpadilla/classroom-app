/**
 * Seed Firebase Emulator with Production Data
 *
 * This script reads all documents from production Firestore
 * and writes them into the local emulator.
 *
 * Prerequisites:
 *   1. Download a service account key from Firebase Console:
 *      Firebase Console > Project Settings > Service Accounts > Generate New Private Key
 *   2. Save it as `scripts/serviceAccountKey.json`
 *   3. Start the emulator: npm run emulators
 *   4. Run this script: node scripts/seed-emulator.js
 *
 * Options:
 *   --collections=users,programs   Only seed specific collections
 *   --dry-run                      Show what would be copied without writing
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// --- Configuration ---
const SERVICE_ACCOUNT_PATH = path.join(__dirname, "../config/serviceAccountKey.json");
const EMULATOR_HOST = "localhost";
const EMULATOR_FIRESTORE_PORT = 8085;
const PROJECT_ID = "classroom-app-157de";

const ALL_COLLECTIONS = [
  "users",
  "programs",
  "classrooms",
  "evaluations",
  "sessions",
  "attendance",
  "participation",
  "classroom_runs",
  "finalization_snapshots",
  "classroom_payment_costs",
  "classroom_student_payments",
  "classroom_payment_statuses",
];

// --- Parse CLI args ---
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const collectionsArg = args.find((a) => a.startsWith("--collections="));
const selectedCollections = collectionsArg
  ? collectionsArg.split("=")[1].split(",")
  : ALL_COLLECTIONS;

// --- Validate service account key ---
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`
  ❌ No se encontro el archivo de service account.

  Para obtenerlo:
    1. Ve a https://console.firebase.google.com/project/${PROJECT_ID}/settings/serviceaccounts/adminsdk
    2. Click "Generate New Private Key"
    3. Guarda el archivo como: scripts/serviceAccountKey.json

  Luego ejecuta de nuevo: node scripts/seed-emulator.js
  `);
  process.exit(1);
}

// --- Initialize Production Admin SDK ---
const serviceAccount = require(SERVICE_ACCOUNT_PATH);

const prodApp = admin.initializeApp(
  {
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT_ID,
  },
  "production"
);
const prodDb = prodApp.firestore();

// --- Initialize Emulator Admin SDK ---
const emulatorApp = admin.initializeApp(
  { projectId: PROJECT_ID },
  "emulator"
);
const emulatorDb = emulatorApp.firestore();
emulatorDb.settings({
  host: `${EMULATOR_HOST}:${EMULATOR_FIRESTORE_PORT}`,
  ssl: false,
});

// --- Helper: serialize Firestore special types for logging ---
function serializeValue(value) {
  if (value instanceof admin.firestore.Timestamp) {
    return value.toDate().toISOString();
  }
  if (value instanceof admin.firestore.GeoPoint) {
    return { lat: value.latitude, lng: value.longitude };
  }
  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const result = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = serializeValue(v);
    }
    return result;
  }
  return value;
}

// --- Main seed function ---
async function seedCollection(collectionName) {
  console.log(`\n📦 Leyendo coleccion: ${collectionName}...`);

  const snapshot = await prodDb.collection(collectionName).get();

  if (snapshot.empty) {
    console.log(`   ⚠️  Coleccion "${collectionName}" esta vacia, saltando.`);
    return 0;
  }

  console.log(`   📄 ${snapshot.size} documentos encontrados`);

  if (dryRun) {
    snapshot.docs.slice(0, 3).forEach((doc) => {
      console.log(`   - ${doc.id}: ${JSON.stringify(serializeValue(doc.data())).slice(0, 100)}...`);
    });
    if (snapshot.size > 3) {
      console.log(`   ... y ${snapshot.size - 3} documentos mas`);
    }
    return snapshot.size;
  }

  // Write in batches of 500 (Firestore limit)
  const BATCH_SIZE = 500;
  const docs = snapshot.docs;
  let written = 0;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = emulatorDb.batch();
    const chunk = docs.slice(i, i + BATCH_SIZE);

    for (const doc of chunk) {
      const ref = emulatorDb.collection(collectionName).doc(doc.id);
      batch.set(ref, doc.data());
    }

    await batch.commit();
    written += chunk.length;

    if (docs.length > BATCH_SIZE) {
      console.log(`   ✅ Escritos ${written}/${docs.length}`);
    }
  }

  console.log(`   ✅ ${written} documentos copiados a emulador`);
  return written;
}

async function main() {
  console.log("🚀 Seed de Firebase Emulator desde Produccion");
  console.log(`   Proyecto: ${PROJECT_ID}`);
  console.log(`   Emulador: ${EMULATOR_HOST}:${EMULATOR_FIRESTORE_PORT}`);
  console.log(`   Colecciones: ${selectedCollections.join(", ")}`);
  if (dryRun) console.log("   ⚡ Modo DRY RUN (no se escribira nada)");
  console.log("─".repeat(50));

  let totalDocs = 0;

  for (const collection of selectedCollections) {
    if (!ALL_COLLECTIONS.includes(collection)) {
      console.warn(`   ⚠️  Coleccion "${collection}" no reconocida, saltando.`);
      continue;
    }
    try {
      const count = await seedCollection(collection);
      totalDocs += count;
    } catch (err) {
      console.error(`   ❌ Error en "${collection}": ${err.message}`);
    }
  }

  console.log("\n" + "─".repeat(50));
  console.log(`✅ Seed completado: ${totalDocs} documentos total`);
  if (dryRun) console.log("   (dry run — nada fue escrito)");

  // Cleanup
  await prodApp.delete();
  await emulatorApp.delete();
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
