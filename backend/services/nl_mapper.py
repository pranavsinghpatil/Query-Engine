from rapidfuzz import process, fuzz

class NLMapper:
    def __init__(self, schema: dict):
        self.schema = schema

        self.synonyms = {
            "name": ["full_name", "employee_name", "name"],
            "salary": ["compensation", "pay", "annual_salary"],
            "department": ["dept", "division", "department"],
            "role": ["position", "title", "role"]
        }

    def best_match(self, keyword: str, table: str):
        columns = self.schema.get(table, [])
        
        # direct and fuzzy match on synonyms
        possible_cols = []
        for key, syns in self.synonyms.items():
            if keyword.lower() == key.lower():
                possible_cols.extend(syns)
        
        # fallback to raw keywords
        possible_cols.append(keyword)

        match, score = process.extractOne(
            possible_cols[0],
            columns,
            scorer=fuzz.partial_ratio
        )

        if score > 60:
            return match
        return None
