"""Audit existing official figures against government pages; never invent or overwrite figures.
Run from repository root: python3 check_sources.py --output work/source-checks.json
A fetch failure stays a failure. New periods and revised numbers require manual review.
"""
import argparse, concurrent.futures, hashlib, html, json, re, urllib.request
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parent
class VisibleText(HTMLParser):
    def __init__(self):super().__init__();self.parts=[];self.skip=0
    def handle_starttag(self,tag,attrs):
        if tag in ('script','style'):self.skip+=1
    def handle_endtag(self,tag):
        if tag in ('script','style'):self.skip=max(0,self.skip-1)
    def handle_data(self,text):
        if not self.skip:self.parts.append(text)
def audit(item):
    key,source=item
    try:
        request=urllib.request.Request(source['url'],headers={'User-Agent':'SalaryTrendPro/2.1 (public statistical source verification)'})
        with urllib.request.urlopen(request,timeout=20) as response:
            raw=response.read();charset=response.headers.get_content_charset() or 'utf-8'
        parser=VisibleText();parser.feed(raw.decode(charset,errors='replace'))
        compact=re.sub(r'\s+','',html.unescape(' '.join(parser.parts)))
        records=[r for r in dataset['records'] if r['source']==key]
        absent=[{'city':r['city'],'year':r['year'],'scope':r['scope'],'annual':r['annual']} for r in records if str(r['annual']) not in compact]
        return {'source':key,'url':source['url'],'status':'needs_review' if absent else 'numbers_present','missing':absent,'sha256':hashlib.sha256(raw).hexdigest(),'note':'数字出现检查不是口径确认；仍需人工核验原文语义、年份和单位。'}
    except Exception as exc:return {'source':key,'url':source['url'],'status':'fetch_failed','error':str(exc)}
if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--output',default='work/source-checks.json');ap.add_argument('--export-js',action='store_true');args=ap.parse_args()
    dataset=json.loads((ROOT/'official.json').read_text())
    if args.export_js:
        (ROOT/'official-data.js').write_text('window.SALARY_OFFICIAL = '+json.dumps(dataset,ensure_ascii=False,indent=2)+';\n')
    else:
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(audit,dataset['sources'].items()))
        out=ROOT/args.output;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
        for r in results:print(r['source']+': '+r['status'])
        raise SystemExit(0 if all(r['status']=='numbers_present' for r in results) else 1)
