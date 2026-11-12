#!/usr/bin/env bash
# O ref é resolvido ao ID imutável; não imprime env, resposta ou erro do processo.
set -euo pipefail
ref=${1:-}; expected=${2:-}
[[ "$ref" =~ ^[A-Za-z0-9_.-]{1,128}$ && "$expected" =~ ^sha256:[a-f0-9]{64}$ ]] || exit 1
inspect(){ timeout --signal=TERM --kill-after=1s 7s docker inspect --format "$1" "$2" 2>/dev/null; }
id=$(inspect '{{.Id}}' "$ref") || exit 1
[[ "$id" =~ ^[a-f0-9]{64}$ && "$(inspect '{{.Image}}' "$id")" == "$expected" ]] || exit 1
# A porta vem da env efetiva do container, sem imprimir valores; limite host e processo.
timeout --signal=TERM --kill-after=1s 7s docker exec "$id" node -e '
const http=require("http");const raw=process.env.PORT;if(!/^[0-9]{1,5}$/.test(raw||""))process.exit(1);const port=Number(raw);if(port<1||port>65535)process.exit(1);let finished=false;const done=n=>{if(!finished){finished=true;process.exit(n)}};const req=http.get({host:"127.0.0.1",port,path:"/api/health",timeout:2000},res=>{if(res.statusCode!==200){res.resume();return done(1)}let body="";res.setEncoding("utf8");res.on("data",x=>{body+=x;if(body.length>16384){req.destroy();done(1)}});res.on("end",()=>{try{const v=JSON.parse(body);done(v&&v.status==="ok"&&v.db==="connected"?0:1)}catch{done(1)}})});req.on("timeout",()=>{req.destroy();done(1)});req.on("error",()=>done(1));setTimeout(()=>done(1),3000).unref();
' >/dev/null 2>&1 || exit 1
[[ "$(inspect '{{.Id}}' "$ref")" == "$id" && "$(inspect '{{.Image}}' "$id")" == "$expected" ]] || exit 1
