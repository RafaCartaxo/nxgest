import {test} from 'node:test'
import assert from 'node:assert/strict'
import {extractBuildZip} from './build-zip.mjs'
import {zip} from './build-zip-fixture.mjs'
test('ZIP aceita somente os dois arquivos regulares e verifica CRC',()=>{const result=extractBuildZip(zip());assert.equal(result.image.toString(),'fixture-image');assert.equal(result.receipt.toString(),'{}');const corrupt=zip();corrupt[39]^=1;assert.throws(()=>extractBuildZip(corrupt))})
test('ZIP rejeita travessia, duplicatas, symlink e truncamento',()=>{for(const v of [zip(['../image.tar','receipt.json']),zip(['image.tar','image.tar']),zip(['image.tar','receipt.json'],[0o120777,0o100600]),zip().subarray(0,50)])assert.throws(()=>extractBuildZip(v))})
