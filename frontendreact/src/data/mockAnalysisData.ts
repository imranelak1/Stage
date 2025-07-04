// Mock analysis data for regions, provinces, and lycees
// This simulates the data that would come from the backend API

export interface Analysis {
  id: string;
  type: 'analyse_generale' | 'analyse_mobilite' | 'analyse_verifier' | 'analyse_denied';
  timestamp: string;
  regionId?: string;
  provinceId?: string;
  lyceeId?: string;
  region_name?: string;
  province_name?: string;
  lycee_name?: string;
  cne?: string;
  gsm?: string;
  salle?: string;
  matiere?: string;
  verificateur_name?: string;
}

// Generate random analyses for each region
const generateAnalyses = (entityId: string, entityType: string, count: number): Analysis[] => {
  const analyses: Analysis[] = [];
  const types = ['analyse_generale', 'analyse_mobilite', 'analyse_verifier', 'analyse_denied'];
  const matieres = ['Mathématiques', 'Physique', 'SVT', 'Histoire-Géo', 'Français', 'Arabe', 'Philosophie'];
  
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)] as Analysis['type'];
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Random date in the last 30 days
    
    const analysis: Analysis = {
      id: `${entityType}-${entityId}-${i}`,
      type,
      timestamp: date.toISOString(),
      cne: `C${Math.floor(1000000 + Math.random() * 9000000)}`,
      gsm: `06${Math.floor(10000000 + Math.random() * 90000000)}`,
      salle: `Salle ${Math.floor(1 + Math.random() * 20)}`,
      matiere: matieres[Math.floor(Math.random() * matieres.length)],
      verificateur_name: `Verificateur ${Math.floor(1 + Math.random() * 10)}`
    };
    
    // Add entity-specific IDs
    if (entityType === 'region') {
      analysis.regionId = entityId;
    } else if (entityType === 'province') {
      analysis.provinceId = entityId;
      analysis.regionId = `0${Math.floor(1 + Math.random() * 7)}`; // Random region ID
    } else if (entityType === 'lycee') {
      analysis.lyceeId = entityId;
      analysis.provinceId = `P${Math.floor(1 + Math.random() * 20)}`;
      analysis.regionId = `0${Math.floor(1 + Math.random() * 7)}`;
    }
    
    analyses.push(analysis);
  }
  
  return analyses;
};

// Generate mock data for regions
const regions = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const regionNames = [
  'Tanger-Tétouan-Al Hoceima',
  'L\'Oriental',
  'Fès-Meknès',
  'Rabat-Salé-Kénitra',
  'Béni Mellal-Khénifra',
  'Casablanca-Settat',
  'Marrakech-Safi',
  'Drâa-Tafilalet',
  'Souss-Massa',
  'Guelmim-Oued Noun',
  'Laâyoune-Sakia El Hamra',
  'Dakhla-Oued Ed-Dahab'
];

// Generate mock data
let allAnalyses: Analysis[] = [];

// Generate analyses for regions
regions.forEach((regionId, index) => {
  const count = Math.floor(5 + Math.random() * 20); // 5-25 analyses per region
  const regionAnalyses = generateAnalyses(regionId, 'region', count);
  
  // Add region name to each analysis
  regionAnalyses.forEach(analysis => {
    analysis.region_name = regionNames[index];
  });
  
  allAnalyses = [...allAnalyses, ...regionAnalyses];
});

// Generate some province analyses
for (let i = 1; i <= 20; i++) {
  const provinceId = `P${i}`;
  const count = Math.floor(3 + Math.random() * 10); // 3-13 analyses per province
  const provinceAnalyses = generateAnalyses(provinceId, 'province', count);
  
  // Add province name to each analysis
  provinceAnalyses.forEach(analysis => {
    analysis.province_name = `Province ${i}`;
    
    // Find the region name for this analysis
    if (analysis.regionId) {
      const regionIndex = regions.indexOf(analysis.regionId);
      if (regionIndex >= 0) {
        analysis.region_name = regionNames[regionIndex];
      }
    }
  });
  
  allAnalyses = [...allAnalyses, ...provinceAnalyses];
}

// Generate some lycee analyses
for (let i = 1; i <= 30; i++) {
  const lyceeId = `L${i}`;
  const count = Math.floor(2 + Math.random() * 8); // 2-10 analyses per lycee
  const lyceeAnalyses = generateAnalyses(lyceeId, 'lycee', count);
  
  // Add lycee name to each analysis
  lyceeAnalyses.forEach(analysis => {
    analysis.lycee_name = `Lycée ${i}`;
    
    // Find the region name for this analysis
    if (analysis.regionId) {
      const regionIndex = regions.indexOf(analysis.regionId);
      if (regionIndex >= 0) {
        analysis.region_name = regionNames[regionIndex];
      }
    }
  });
  
  allAnalyses = [...allAnalyses, ...lyceeAnalyses];
}

export const mockAnalysisData = allAnalyses;

// Group analyses by entity ID for easy lookup
export const groupAnalysesByEntity = () => {
  const groupedData: Record<string, Analysis[]> = {};
  
  mockAnalysisData.forEach(analysis => {
    // Group by region
    if (analysis.regionId) {
      if (!groupedData[analysis.regionId]) {
        groupedData[analysis.regionId] = [];
      }
      groupedData[analysis.regionId].push(analysis);
    }
    
    // Group by province
    if (analysis.provinceId) {
      if (!groupedData[analysis.provinceId]) {
        groupedData[analysis.provinceId] = [];
      }
      groupedData[analysis.provinceId].push(analysis);
    }
    
    // Group by lycee
    if (analysis.lyceeId) {
      if (!groupedData[analysis.lyceeId]) {
        groupedData[analysis.lyceeId] = [];
      }
      groupedData[analysis.lyceeId].push(analysis);
    }
  });
  
  return groupedData;
};

export default mockAnalysisData;
