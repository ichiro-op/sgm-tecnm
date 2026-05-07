const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, 'data', 'database.sqlite')
const EQUIPOS_PATH = path.join(__dirname, 'data', 'equipos.json')

if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'))
}

const db = new Database(DB_PATH)

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    foto TEXT,
    numero_control TEXT,
    rol TEXT DEFAULT 'usuario',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipo_id TEXT NOT NULL,
    equipo_nombre TEXT NOT NULL,
    laboratorio TEXT NOT NULL,
    tipo_falla TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    usuario_id INTEGER NOT NULL,
    usuario_nombre TEXT NOT NULL,
    usuario_email TEXT NOT NULL,
    estado TEXT DEFAULT 'pendiente',
    prioridad TEXT DEFAULT 'media',
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion DATETIME,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
  );
`)

// Migración: agregar columna nota_resolucion si no existe (BD ya creadas)
try { db.exec('ALTER TABLE tickets ADD COLUMN nota_resolucion TEXT') } catch (_) {}

// ── Equipos (JSON) ──────────────────────────────────────────────
function getEquipos() {
  if (!fs.existsSync(EQUIPOS_PATH)) {
    const seed = getEquiposSeed()
    fs.writeFileSync(EQUIPOS_PATH, JSON.stringify(seed, null, 2))
    return seed
  }
  return JSON.parse(fs.readFileSync(EQUIPOS_PATH, 'utf-8'))
}

function saveEquipos(equipos) {
  fs.writeFileSync(EQUIPOS_PATH, JSON.stringify(equipos, null, 2))
}

function getEquiposSeed() {
  return [
    // ── Gastronomía ───────────────────────────────────────────────
    { id: '1',  nombre: 'Refrigerador Industrial ASBER HRR',          laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-001',              imagen: '' },
    { id: '2',  nombre: 'Laminadora de Masa MIGSA Dq-520C',           laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-002',              imagen: '' },
    { id: '3',  nombre: 'Horno Turbolino Alpha',                       laboratorio: 'Gastronomía', estado: 'fuera de servicio',  numero_serie: 'GAS-003',              imagen: '' },
    { id: '4',  nombre: 'Parrilla a Gas Delta 4 Quemadores #1',       laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-004',              imagen: '' },
    { id: '5',  nombre: 'Parrilla a Gas Delta 4 Quemadores #2',       laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-005',              imagen: '' },
    { id: '6',  nombre: 'Batidora B-30BC',                            laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: '2108BA30013',          imagen: '' },
    { id: '7',  nombre: 'Horno Microondas Torrey MIT-1.2T',           laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-006',              imagen: '' },
    { id: '8',  nombre: 'Abatidor de Temperatura ASBER EBC-05',       laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: '8102745022',           imagen: '' },
    { id: '9',  nombre: 'Cafetera Bellini MS-100',                    laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-007',              imagen: '' },
    { id: '10', nombre: 'Molino Dosificador CASADIO',                 laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-008',              imagen: '' },
    { id: '11', nombre: 'Fabricadora de Hielo MIGSA ZBF-60',          laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-009',              imagen: '' },
    { id: '12', nombre: 'Parrilla de Inducción MIGSA IC-2500 #1',     laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-010',              imagen: '' },
    { id: '13', nombre: 'Parrilla de Inducción MIGSA IC-2500 #2',     laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-011',              imagen: '' },
    { id: '14', nombre: 'Estufa Delta 6 Quemadores - Cocina Mixta #1',laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-012',              imagen: '' },
    { id: '15', nombre: 'Estufa Delta 6 Quemadores - Cocina Mixta #2',laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-013',              imagen: '' },
    { id: '16', nombre: 'Estufa Delta 6 Quemadores - Cocina Mixta #3',laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-014',              imagen: '' },
    { id: '17', nombre: 'Estufa Delta 6 Quemadores - Cocina Mixta #4',laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-015',              imagen: '' },
    { id: '18', nombre: 'Licuadora Industrial International #1',       laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-016',              imagen: '' },
    { id: '19', nombre: 'Licuadora Industrial International #2',       laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-017',              imagen: '' },
    { id: '20', nombre: 'Horno Mixto CHEFTOP - Cocina Mixta',         laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-018',              imagen: '' },
    { id: '21', nombre: 'Estufa Delta 6Q - Cocina Int. #1',           laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-019',              imagen: '' },
    { id: '22', nombre: 'Estufa Delta 6Q - Cocina Int. #2',           laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-020',              imagen: '' },
    { id: '23', nombre: 'Estufa Delta 6Q - Cocina Int. #3',           laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-021',              imagen: '' },
    { id: '24', nombre: 'Estufa Delta 6Q - Cocina Int. #4',           laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-022',              imagen: '' },
    { id: '25', nombre: 'Estufa Delta 6Q - Cocina Int. #5',           laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-023',              imagen: '' },
    { id: '26', nombre: 'Estufa Delta 6Q - Cocina Int. #6',           laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-024',              imagen: '' },
    { id: '27', nombre: 'Estufa Delta 6Q - Cocina Int. #7',           laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-025',              imagen: '' },
    { id: '28', nombre: 'Estufa Delta 6Q - Cocina Int. #8',           laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-026',              imagen: '' },
    { id: '29', nombre: 'Estufón Delta IE-1 #1',                      laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-027',              imagen: '' },
    { id: '30', nombre: 'Estufón Delta IE-1 #2',                      laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-028',              imagen: '' },
    { id: '31', nombre: 'Freidora ASBER AEF-50-S LPG',                laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-029',              imagen: '' },
    { id: '32', nombre: 'Carro Caliente ASBER/EDENOX CCB-10 #1',      laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-030',              imagen: '' },
    { id: '33', nombre: 'Carro Caliente ASBER/EDENOX CCB-10 #2',      laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-031',              imagen: '' },
    { id: '34', nombre: 'Horno Mixto CHEFTOP - Cocina Int.',          laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-032',              imagen: '' },
    { id: '35', nombre: 'Horno Microondas LG #1',                     laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-033',              imagen: '' },
    { id: '36', nombre: 'Horno Microondas LG #2',                     laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-034',              imagen: '' },
    { id: '37', nombre: 'Estufa Wok FR-W36',                          laboratorio: 'Gastronomía', estado: 'funcional',          numero_serie: 'GAS-035',              imagen: '' },
    { id: '38', nombre: 'Horno (Inhabilitado)',                        laboratorio: 'Gastronomía', estado: 'fuera de servicio',  numero_serie: 'GAS-036',              imagen: '' },
    // ── Básicas ───────────────────────────────────────────────────
    { id: '39', nombre: 'Autoclave WAC-47 WITEG',                     laboratorio: 'Básicas',     estado: 'funcional',          numero_serie: 'BAS-001',              imagen: '' },
    { id: '40', nombre: 'Horno de Secado Novatech HS60-AID',          laboratorio: 'Básicas',     estado: 'funcional',          numero_serie: 'BAS-002',              imagen: '' },
    { id: '41', nombre: 'Campana de Extracción Novatech ple-204',     laboratorio: 'Básicas',     estado: 'funcional',          numero_serie: 'BAS-003',              imagen: '' },
    { id: '42', nombre: 'Incubadora SWIG SmartLab 70°C WITEG',        laboratorio: 'Básicas',     estado: 'funcional',          numero_serie: 'BAS-004',              imagen: '' },
    { id: '43', nombre: 'Esterilizador All American 75x',             laboratorio: 'Básicas',     estado: 'funcional',          numero_serie: 'BAS-005',              imagen: '' },
    { id: '44', nombre: 'Proyector BenQ MX501',                       laboratorio: 'Básicas',     estado: 'funcional',          numero_serie: 'BAS-006',              imagen: '' },
    // ── Electromecánica ───────────────────────────────────────────
    { id: '45', nombre: 'Centro de Torneado CNC HAAS ST-10',          laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-001',              imagen: '' },
    { id: '46', nombre: 'Afiladora Universal U2',                     laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-002',              imagen: '' },
    { id: '47', nombre: 'Centro de Mecanizado HAAS VF-2',             laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-003',              imagen: '' },
    { id: '48', nombre: 'Motor Didáctico',                            laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-004',              imagen: '' },
    { id: '49', nombre: 'Transportadora',                             laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-005',              imagen: '' },
    { id: '50', nombre: 'Robot ABB IRC5 M2004 #1',                    laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: '360-500878',           imagen: '' },
    { id: '51', nombre: 'Robot ABB IRC5 M2004 #2',                    laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-006',              imagen: '' },
    { id: '52', nombre: 'Robot ABB Delta M-1 i A/1H #1',             laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-007',              imagen: '' },
    { id: '53', nombre: 'Robot ABB Delta M-1 i A/1H #2',             laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-008',              imagen: '' },
    { id: '54', nombre: 'Horno Industrial',                           laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-009',              imagen: '' },
    { id: '55', nombre: 'Limadora Industrial Baldor',                 laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'L-1',                  imagen: '' },
    { id: '56', nombre: 'Taladro Industrial Z5032G',                  laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: '807',                  imagen: '' },
    { id: '57', nombre: 'Fresadora Chevalier FM-3VK',                 laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'KM93A301',             imagen: '' },
    { id: '58', nombre: 'Limadora Industrial Dayton',                 laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'LR15562',              imagen: '' },
    { id: '59', nombre: 'Torno PINACHO SP-200',                       laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-010',              imagen: '' },
    { id: '60', nombre: 'Cinta de Sierra 9"x16"',                    laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-011',              imagen: '' },
    { id: '61', nombre: 'Sistema Integrado de Manufactura',           laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-012',              imagen: '' },
    { id: '62', nombre: 'PC HP 280 G3 - Industria 4.0',              laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-013',              imagen: '' },
    { id: '63', nombre: 'Rack Metalico Linkedpro LPREP1202.5',        laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-014',              imagen: '' },
    { id: '64', nombre: 'Robot Educativo Mover5',                     laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-015',              imagen: '' },
    { id: '65', nombre: 'Televisor Samsung UHD 4K 65"',               laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-016',              imagen: '' },
    { id: '66', nombre: 'No-Break ISB Sola Basic',                    laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'E18l10340',            imagen: '' },
    { id: '67', nombre: 'Robot KUKA',                                 laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: '510628',               imagen: '' },
    { id: '68', nombre: 'Router Gigabit WiFi AC1750',                 laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: '217B706000958',        imagen: '' },
    { id: '69', nombre: 'DELL OptiPlex 5050',                         laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-017',              imagen: '' },
    { id: '70', nombre: 'Ball & Beam System GBB2004',                 laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-018',              imagen: '' },
    { id: '71', nombre: 'Fuente de Alimentación Keithley 2231A-30-3', laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-019',              imagen: '' },
    { id: '72', nombre: 'Convertidor de Frecuencia #1',               laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-020',              imagen: '' },
    { id: '73', nombre: 'Convertidor de Frecuencia #2',               laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-021',              imagen: '' },
    { id: '74', nombre: 'Impresora 3D Colibrí PRO V3 #1',            laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-022',              imagen: '' },
    { id: '75', nombre: 'Impresora 3D Colibrí PRO V3 #2',            laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-023',              imagen: '' },
    { id: '76', nombre: 'Impresora 3D Colibrí PRO V3 #3',            laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-024',              imagen: '' },
    { id: '77', nombre: 'Impresora 3D ProJet SD6000',                 laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-025',              imagen: '' },
    { id: '78', nombre: 'Aparato de Limpieza SCA 1200HT',             laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-026',              imagen: '' },
    { id: '79', nombre: 'Trainer Hydrostatic Gunt HM 115',            laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-027',              imagen: '' },
    { id: '80', nombre: 'Sistema Gunt HM 150.09',                     laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-028',              imagen: '' },
    { id: '81', nombre: 'Sistema HM 150.11',                          laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-029',              imagen: '' },
    { id: '82', nombre: 'Bomba Centrífuga Gunt HN 150.04',            laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-030',              imagen: '' },
    { id: '83', nombre: 'Motor de Inducción Kopack ML',               laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-031',              imagen: '' },
    { id: '84', nombre: 'HP Z220 Workstation',                        laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-032',              imagen: '' },
    { id: '85', nombre: 'Desktop HP Pro 400 G9',                      laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-033',              imagen: '' },
    { id: '86', nombre: 'Proyector Epson Powerlite 118',              laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-034',              imagen: '' },
    { id: '87', nombre: 'Smart TV LG UHD 75"',                        laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-035',              imagen: '' },
    { id: '88', nombre: 'Estación de Trabajo Didáctica #1',           laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-036',              imagen: '' },
    { id: '89', nombre: 'Estación de Trabajo Didáctica #2',           laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-037',              imagen: '' },
    { id: '90', nombre: 'Estación Didáctica con Motor',               laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-038',              imagen: '' },
    { id: '91', nombre: 'Triturador de Metales',                      laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-039',              imagen: '' },
    { id: '92', nombre: 'Regulador VOGAR LAN-330-440',                laboratorio: 'Electromecánica', estado: 'funcional',      numero_serie: 'ELC-040',              imagen: '' },
    // ── Industrial ────────────────────────────────────────────────
    { id: '93',  nombre: 'Equipo de Cómputo HP Compaq Pro - LC1',     laboratorio: 'Industrial',  estado: 'funcional',          numero_serie: 'IND-001',              imagen: '' },
    { id: '94',  nombre: 'Smart Board - LC1',                         laboratorio: 'Industrial',  estado: 'funcional',          numero_serie: 'IND-002',              imagen: '' },
    { id: '95',  nombre: 'Proyector EPSON Power Lite S39',            laboratorio: 'Industrial',  estado: 'funcional',          numero_serie: 'IND-003',              imagen: '' },
    { id: '96',  nombre: 'Regulador VOGAR LAN 315',                   laboratorio: 'Industrial',  estado: 'funcional',          numero_serie: '193',                  imagen: '' },
    { id: '97',  nombre: 'Equipo de Cómputo HP ProDesk - LC2',        laboratorio: 'Industrial',  estado: 'funcional',          numero_serie: 'IND-004',              imagen: '' },
    { id: '98',  nombre: 'Smart Board - LC2',                         laboratorio: 'Industrial',  estado: 'funcional',          numero_serie: 'IND-005',              imagen: '' },
    { id: '99',  nombre: 'Regulador VOGAR LAN-324',                   laboratorio: 'Industrial',  estado: 'funcional',          numero_serie: '2601',                 imagen: '' },
    { id: '100', nombre: 'Cinta Transportadora - LMEI',               laboratorio: 'Industrial',  estado: 'funcional',          numero_serie: 'IND-006',              imagen: '' },
    { id: '101', nombre: 'Durómetro INNOVATEST Cientec',              laboratorio: 'Industrial',  estado: 'funcional',          numero_serie: 'IND-007',              imagen: '' },
    { id: '102', nombre: 'Máquina de Medición Óptica ST Industries',  laboratorio: 'Industrial',  estado: 'funcional',          numero_serie: 'IND-008',              imagen: '' },
    { id: '103', nombre: 'Microdurometro Cientec',                    laboratorio: 'Industrial',  estado: 'funcional',          numero_serie: 'IND-009',              imagen: '' },
    { id: '104', nombre: 'Durómetro INNOVATEST 600BDL',               laboratorio: 'Industrial',  estado: 'funcional',          numero_serie: '14408',                imagen: '' },
    // ── Impresoras 3D ─────────────────────────────────────────────
    { id: '105', nombre: 'Creality Ender-3 v2',                       laboratorio: 'Impresoras 3D', estado: 'funcional',        numero_serie: 'P202J08I09045',        imagen: '' },
    { id: '106', nombre: 'Creality Ender-3 v3 SE #1',                 laboratorio: 'Impresoras 3D', estado: 'funcional',        numero_serie: '100005947333223KIJP', imagen: '' },
    { id: '107', nombre: 'Creality Hi',                               laboratorio: 'Impresoras 3D', estado: 'funcional',        numero_serie: '500002297433225DC0L', imagen: '' },
    { id: '108', nombre: 'Creality Ender-3 v3 SE #2',                 laboratorio: 'Impresoras 3D', estado: 'funcional',        numero_serie: '100006541733124BXQY', imagen: '' },
    { id: '109', nombre: 'Creality Ender-3 v3 SE #3',                 laboratorio: 'Impresoras 3D', estado: 'funcional',        numero_serie: '500001957033424IYIC', imagen: '' },
    { id: '110', nombre: 'Sistema de Gestión de Filamento Creality CFS', laboratorio: 'Impresoras 3D', estado: 'funcional',     numero_serie: 'IMP-001',              imagen: '' },
    { id: '111', nombre: 'Creality Space Pi Filament Dryer #1',       laboratorio: 'Impresoras 3D', estado: 'funcional',        numero_serie: '100007020122B24EKMU', imagen: '' },
    { id: '112', nombre: 'Creality Space Pi Filament Dryer #2',       laboratorio: 'Impresoras 3D', estado: 'funcional',        numero_serie: '100006846922A24DAEJ', imagen: '' },
    { id: '113', nombre: 'Creality Space Pi Filament Dryer #3',       laboratorio: 'Impresoras 3D', estado: 'funcional',        numero_serie: '100007020122B24ETJK', imagen: '' },
    // ── Química Orgánica ──────────────────────────────────────────
    { id: '114', nombre: 'Microscopio Biológico con Cámara #1',       laboratorio: 'Química Orgánica', estado: 'funcional',    numero_serie: 'QOR-001',              imagen: '' },
    { id: '115', nombre: 'Microscopio Biológico con Cámara #2',       laboratorio: 'Química Orgánica', estado: 'funcional',    numero_serie: 'QOR-002',              imagen: '' },
    { id: '116', nombre: 'Microscopio Biológico con Cámara #3',       laboratorio: 'Química Orgánica', estado: 'funcional',    numero_serie: 'QOR-003',              imagen: '' },
    { id: '117', nombre: 'Microcam-3 #1',                             laboratorio: 'Química Orgánica', estado: 'funcional',    numero_serie: 'QOR-004',              imagen: '' },
    { id: '118', nombre: 'Microcam-3 #2',                             laboratorio: 'Química Orgánica', estado: 'funcional',    numero_serie: 'QOR-005',              imagen: '' },
    { id: '119', nombre: 'Microcam-3 #3',                             laboratorio: 'Química Orgánica', estado: 'funcional',    numero_serie: 'QOR-006',              imagen: '' },
    { id: '120', nombre: 'Horno Microondas Industrial Torrey',        laboratorio: 'Química Orgánica', estado: 'funcional',    numero_serie: 'QOR-007',              imagen: '' },
    { id: '121', nombre: 'Destilador de Alcohol 30L',                 laboratorio: 'Química Orgánica', estado: 'funcional',    numero_serie: 'QOR-008',              imagen: '' },
    { id: '122', nombre: 'Refractómetro',                             laboratorio: 'Química Orgánica', estado: 'funcional',    numero_serie: 'QOR-009',              imagen: '' },
    { id: '123', nombre: 'Selladora al Vacío',                        laboratorio: 'Química Orgánica', estado: 'funcional',    numero_serie: 'QOR-010',              imagen: '' },
    { id: '124', nombre: 'Sous Vide',                                  laboratorio: 'Química Orgánica', estado: 'funcional',    numero_serie: 'QOR-011',              imagen: '' },
    { id: '125', nombre: 'Mechero Bunsen #1',                         laboratorio: 'Química Orgánica', estado: 'funcional',    numero_serie: 'QOR-012',              imagen: '' },
    { id: '126', nombre: 'Mechero Bunsen #2',                         laboratorio: 'Química Orgánica', estado: 'funcional',    numero_serie: 'QOR-013',              imagen: '' },
    { id: '127', nombre: 'Mechero Bunsen #3',                         laboratorio: 'Química Orgánica', estado: 'funcional',    numero_serie: 'QOR-014',              imagen: '' },
  ]
}

// ── Prioridad automática ─────────────────────────────────────────
function calcularPrioridad(equipo_id) {
  const count = db.prepare(
    "SELECT COUNT(*) as c FROM tickets WHERE equipo_id = ? AND estado != 'resuelto'"
  ).get(equipo_id)
  if (count.c >= 5) return 'alta'
  if (count.c >= 2) return 'media'
  return 'baja'
}

module.exports = { db, getEquipos, saveEquipos, calcularPrioridad }
