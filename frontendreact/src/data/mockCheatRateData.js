// Données de démonstration pour les taux de triche
const mockCheatRateData = {
  byRegion: [
    { 
      id: '1', 
      name: 'Tanger-Tétouan-Al Hoceïma', 
      analyses: [
        {
          id: 'r1-mock-1',
          type: 'analyse_generale',
          regionId: '1',
          date: new Date().toISOString(),
          cne: '501234',
          detection_count: 2,
          session: '1'
        },
        {
          id: 'r1-mock-2',
          type: 'analyse_mobilite',
          regionId: '1',
          date: new Date().toISOString(),
          cne: '505678',
          detection_count: 1,
          session: '1'
        }
      ]
    },
    { 
      id: '2', 
      name: 'L\'Oriental', 
      analyses: [
        {
          id: 'r2-mock-1',
          type: 'analyse_generale',
          regionId: '2',
          date: new Date().toISOString(),
          cne: '509876',
          detection_count: 3,
          session: '1'
        },
        {
          id: 'r2-mock-2',
          type: 'analyse_verifier',
          regionId: '2',
          date: new Date().toISOString(),
          cne: '504321',
          detection_count: 1,
          session: '1'
        },
        {
          id: 'r2-mock-3',
          type: 'analyse_denied',
          regionId: '2',
          date: new Date().toISOString(),
          cne: '507890',
          detection_count: 1,
          session: '1'
        }
      ]
    }
  ],
  byProvince: [
    {
      id: 'p1',
      name: 'Province Test 1',
      analyses: [
        {
          id: 'p1-mock-1',
          type: 'analyse_generale',
          provinceId: 'p1',
          date: new Date().toISOString(),
          cne: '501111',
          detection_count: 2,
          session: '1'
        }
      ]
    }
  ]
};

export default mockCheatRateData;
