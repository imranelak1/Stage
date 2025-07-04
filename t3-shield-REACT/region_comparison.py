from fastapi import APIRouter, HTTPException, status, Request
from db_connection import Database
from typing import Optional

router = APIRouter()
db = Database()

@router.get("/t3shield/api/region-comparison")
def region_comparison(
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    request: Request = None
):
    try:
        query = """
        SELECT 
            a.name as region,
            a.codeAref as region_code,
            COUNT(DISTINCT l.codeCentre) as schools_with_activity,
            SUM(cr.nbr_etudiant) as students,
            SUM(cr.nbr_detection) as detections,
            CASE WHEN SUM(cr.nbr_etudiant) > 0 THEN ROUND((SUM(cr.nbr_detection) / SUM(cr.nbr_etudiant)) * 100, 2) ELSE 0 END as cheat_rate
        FROM cheat_rate cr
        JOIN lycee l ON cr.codeCentre = l.codeCentre
        JOIN ville v ON l.id_ville = v.id_ville
        JOIN dp d ON v.id_dp = d.id_dp
        JOIN aref a ON d.codeAref = a.codeAref
        WHERE cr.date BETWEEN %s AND %s
        GROUP BY a.codeAref, a.name
        ORDER BY region;
        """
        params = [start_time, end_time]
        results = db.execute_query(query, tuple(params))
        if results is None:
            results = []
        for row in results:
            row["detection_rate"] = round((row["detections"] / row["students"] * 100), 2) if row["students"] else 0
        return results
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/t3shield/api/region-active-schools")
def region_active_schools(
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    request: Request = None
):
    try:
        query = """
        SELECT 
            a.name AS region,
            a.codeAref AS region_code,
            COUNT(DISTINCT l.codeCentre) AS schools_with_activity
        FROM cheat_rate cr
        JOIN lycee l ON cr.codeCentre = l.codeCentre
        JOIN ville v ON l.id_ville = v.id_ville
        JOIN dp d ON v.id_dp = d.id_dp
        JOIN aref a ON d.codeAref = a.codeAref
        WHERE cr.date BETWEEN %s AND %s
        GROUP BY a.codeAref, a.name
        ORDER BY region;
        """
        params = [start_time, end_time]
        results = db.execute_query(query, tuple(params))
        if results is None:
            results = []
        return results
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)) 