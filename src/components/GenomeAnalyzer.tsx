import React, { useRef, useState } from 'react';
import { Upload, Download, Share2 } from 'lucide-react';
import {
  analyzeGenome,
  readGenomeFile,
  Genome,
  AnalysisResult,
} from '../services/genome';

const GenomeAnalyzer: React.FC = () => {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [genomes, setGenomes] = useState<Genome[]>([]);
  const [results, setResults] = useState<Record<string, AnalysisResult>>({});
  const [loading, setLoading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    setLoading(true);
    for (const file of Array.from(files)) {
      try {
        const genome = await readGenomeFile(file);
        const analysis = await analyzeGenome(genome);
        setGenomes((g) => [...g, genome]);
        setResults((r) => ({ ...r, [genome.id]: analysis }));
      } catch (err) {
        console.error('Failed to process', file.name, err);
      }
    }
    setLoading(false);
    if (fileInput.current) fileInput.current.value = '';
  };

  const downloadFasta = (genome: Genome) => {
    const content = `>${genome.name}\n${genome.sequence.replace(/(.{80})/g, '$1\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${genome.name}.fasta`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadReport = (genome: Genome, analysis: AnalysisResult) => {
    const data = {
      genome: genome.name,
      size: genome.size,
      gcContent: genome.gcContent,
      traits: analysis.traits,
      recommendations: analysis.recommendations,
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${genome.name}_analysis.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareGenome = async (genome: Genome) => {
    const text = `${genome.name} | length ${genome.size}bp | GC ${genome.gcContent}%`;
    try {
      await navigator.clipboard.writeText(text);
      alert('Genome information copied to clipboard');
    } catch (err) {
      console.error('Clipboard error', err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => fileInput.current?.click()}
          className="px-4 py-2 bg-blue-600 text-white rounded flex items-center space-x-2"
        >
          <Upload size={16} />
          <span>Upload Genomes</span>
        </button>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept=".txt,.fasta,.fa,.fas,.fna,.gb,.gbk"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        {loading && <span className="text-gray-600">Analyzing…</span>}
      </div>

      {genomes.map((g) => {
        const r = results[g.id];
        return (
          <div key={g.id} className="border rounded p-4 space-y-2">
            <div className="flex justify-between">
              <div>
                <h2 className="font-semibold">{g.name}</h2>
                <p className="text-sm text-gray-500">
                  {g.size.toLocaleString()} bp • GC {g.gcContent}%
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => downloadFasta(g)}
                  className="p-2 bg-gray-100 rounded hover:bg-gray-200"
                  title="Download FASTA"
                >
                  <Download size={16} />
                </button>
                {r && (
                  <button
                    onClick={() => downloadReport(g, r)}
                    className="p-2 bg-gray-100 rounded hover:bg-gray-200"
                    title="Download Analysis"
                  >
                    <Download size={16} />
                  </button>
                )}
                <button
                  onClick={() => shareGenome(g)}
                  className="p-2 bg-gray-100 rounded hover:bg-gray-200"
                  title="Copy genome info"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>
            {r && (
              <div>
                <h3 className="font-medium mt-2">Trait Scores</h3>
                <ul className="list-disc ml-5 text-sm">
                  {r.traits.map((t) => (
                    <li key={t.name}>
                      {t.name}: {t.score}%
                    </li>
                  ))}
                </ul>
                <h3 className="font-medium mt-2">Recommendations</h3>
                <ul className="list-disc ml-5 text-sm">
                  {r.recommendations.map((rec) => (
                    <li key={rec}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GenomeAnalyzer;
