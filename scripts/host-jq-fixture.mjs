// Apenas cópias de checkout sintéticas: não modifica helper de produção.
import {readFileSync,writeFileSync,mkdirSync,chmodSync} from 'node:fs'
import {createHash} from 'node:crypto'
import path from 'node:path'
export function fixtureJq(source, checkout) {
  const wrapper = '#!/bin/sh\nexec /usr/bin/jq "$@"\n'
  const digest = createHash('sha256').update(wrapper).digest('hex')
  const helper = path.join(source,'scripts/host-jq.sh')
  const text = readFileSync(helper,'utf8').replace('b1c22172dd303f3be49e935aa56aa48a8b7a46e0bc838b4997d3bb451495870f',digest)
  writeFileSync(helper,text)
  const dir = path.join(checkout,'.git/nxgest-tools')
  mkdirSync(dir,{mode:0o700});chmodSync(dir,0o700)
  writeFileSync(path.join(dir,'jq'),wrapper,{mode:0o700})
}
