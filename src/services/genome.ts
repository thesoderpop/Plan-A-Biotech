export interface GenomeMetadata {
  organism?: string;
  definition?: string;
}

export interface Genome {
  id: string;
  name: string;
  sequence: string;
  size: number;
  gcContent: number;
  metadata: GenomeMetadata;
  uploadedAt: Date;
}

function parseFasta(text: string): { sequence: string; metadata: GenomeMetadata } {
  const lines = text.split(/\r?\n/);
  let sequence = '';
  const metadata: GenomeMetadata = {};
  for (const line of lines) {
    if (line.startsWith('>')) {
      const header = line.substring(1).trim();
      if (header) metadata.organism = header;
    } else {
      sequence += line.trim();
    }
  }
  sequence = sequence.toUpperCase().replace(/[^ACGTN]/g, '');
  return { sequence, metadata };
}

function parseGenBank(text: string): { sequence: string; metadata: GenomeMetadata } {
  const lines = text.split(/\r?\n/);
  let inOrigin = false;
  let sequence = '';
  const metadata: GenomeMetadata = {};
  for (const line of lines) {
    if (line.startsWith('DEFINITION')) {
      metadata.definition = line.substring(10).trim();
    } else if (line.startsWith('ORGANISM')) {
      metadata.organism = line.substring(8).trim();
    } else if (line.startsWith('ORIGIN')) {
      inOrigin = true;
    } else if (line.startsWith('//')) {
      break;
    } else if (inOrigin) {
      sequence += line.replace(/[^acgtn]/gi, '').toUpperCase();
    }
  }
  return { sequence, metadata };
}

export async function readGenomeFile(file: File): Promise<Genome> {
  const text = await file.text();
  const ext = file.name.toLowerCase().split('.').pop();
  let parsed: { sequence: string; metadata: GenomeMetadata };
  switch (ext) {
    case 'fasta':
    case 'fa':
    case 'fas':
    case 'fna':
      parsed = parseFasta(text);
      break;
    case 'gb':
    case 'gbk':
      parsed = parseGenBank(text);
      break;
    default:
      parsed = {
        sequence: text.toUpperCase().replace(/[^ACGTN]/g, ''),
        metadata: {}
      };
  }
  if (!parsed.sequence || parsed.sequence.length < 10) {
    throw new Error('Genome sequence too short or invalid');
  }
  const gc = ((parsed.sequence.match(/[GC]/g) || []).length / parsed.sequence.length) * 100;
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: file.name.replace(/\.[^.]+$/, ''),
    sequence: parsed.sequence,
    size: parsed.sequence.length,
    gcContent: parseFloat(gc.toFixed(2)),
    metadata: parsed.metadata,
    uploadedAt: new Date()
  };
}

export interface TraitScore {
  name: string;
  score: number;
}

export interface AnalysisResult {
  traits: TraitScore[];
  recommendations: string[];
}

function hashSequence(seq: string): number {
  let h = 0;
  for (let i = 0; i < seq.length; i++) {
    h = (h * 31 + seq.charCodeAt(i)) >>> 0;
  }
  return h;
}

export async function analyzeGenome(genome: Genome): Promise<AnalysisResult> {
  // Placeholder deterministic analysis; integrate with real service in production
  const traits = ['Height', 'Disease Resistance', 'Metabolism', 'Longevity'];
  const h = hashSequence(genome.sequence);
  const traitScores = traits.map((name, i) => ({
    name,
    score: (h >> (i * 8)) % 101
  }));
  const recommendations = [
    'Consult a specialist for tailored interpretation',
    'Combine genomic insights with clinical data'
  ];
  return { traits: traitScores, recommendations };
}
