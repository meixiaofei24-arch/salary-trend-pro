"""Regenerate browser snapshots and a transparent national coverage report. No network or estimates."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
data={}
for name,key in [('official','SALARY_OFFICIAL'),('directory','SALARY_DIRECTORY'),('benefits','SALARY_BENEFITS')]:
    data[name]=json.loads((ROOT/(name+'.json')).read_text())
    (ROOT/(name+'-data.js')).write_text('window.'+key+' = '+json.dumps(data[name],ensure_ascii=False,separators=(',',':'))+';\n')
progress={'checkedOn':data['official']['verifiedOn'],'method':'对337个目录地区分别检索2025年及不限年份的政府工资公开来源；检索命中不等于数据已核验。仅已核验记录入库。','cities':[]}
for city in data['directory']['cities']:
    wages=[r for r in data['official']['records'] if r['city']==city['name']]
    bases=[r for r in data['benefits']['bases'] if r['year']==2026 and r['region'] in (city['province'],city['name'])]
    progress['cities'].append({'code':city['code'],'city':city['name'],'province':city['province'],'wageStatus':'部分年度口径已收录' if wages else '已检索，数值待核验','wageRecordCount':len(wages),'wageYears':sorted({r['year'] for r in wages}),'benefitComponents':sorted({k for r in bases for k in r['components']}),'benefitStatus':'部分基数已收录' if bases else '本地基数待核验'})
(ROOT/'coverage.json').write_text(json.dumps(progress,ensure_ascii=False,indent=2)+'\n')
