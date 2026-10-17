import assert from "node:assert/strict";
import test from "node:test";
import {cleanMany,cleanUrl,parseRules,createRuleProfile,readRuleProfile,normalizeHost,validateHostRules,createAuditExport} from "../src/core.js";
const policy = (host, includeSubdomains=false) => ({host,includeSubdomains,removeRules:parseRules("ref"),keepRules:parseRules("utm_content")});
test("exact hosts and explicit dot-boundary subdomains",()=>{
  const options={hostRules:[policy("SHOP.Example.")]};
  assert.equal(cleanUrl("https://shop.example:8443/?ref=secret&x=%2F#frag",options).cleaned,"https://shop.example:8443/?x=%2F#frag");
  for(const host of ["sub.shop.example","evilshop.example","shop.example.evil"]) assert(cleanUrl("https://"+host+"/?ref=x",options).cleaned.includes("ref=x"));
  options.hostRules[0].includeSubdomains=true;
  assert.equal(cleanUrl("https://sub.shop.example/?ref=x&utm_content=y",options).cleaned,"https://sub.shop.example/?utm_content=y");
});
test("global or matching host keep rules win and batches remain independent",()=>{
  const options={hostRules:[policy("shop.example",true)],removeRules:parseRules("utm_content"),keepRules:parseRules("ref")};
  assert.equal(cleanUrl("https://shop.example/?ref=x&utm_content=y",options).changed,false);
  const results=cleanMany("https://shop.example/?ref=x\nhttps://other.example/?ref=x",{hostRules:[policy("shop.example")]});
  assert.equal(results[0].cleaned,"https://shop.example/");
  assert.equal(results[1].cleaned,"https://other.example/?ref=x");
});
test("portable v2 rules omit unrelated data and v1 imports",()=>{
  const p=createRuleProfile("global","",[policy("shop.example")]);
  assert.equal(p.schemaVersion,2);
  assert.deepEqual(readRuleProfile(JSON.stringify(p)).hostRules,p.hostRules);
  assert.deepEqual(readRuleProfile({...p,schemaVersion:1}).hostRules,[]);
  assert.equal(normalizeHost("BÜCHER.example"),"xn--bcher-kva.example");
  const clean=validateHostRules([{...policy("shop.example"),privateUrl:"SECRET"}]);
  assert(!JSON.stringify(clean).includes("SECRET"));
});
test("reject invalid and oversized profiles without accepting URLs",()=>{
  for(const host of ["https://example.com","a.example/path","*.example","a:443","a@b","-a.example","a..b","x y","[::1]"]) assert.throws(()=>normalizeHost(host));
  assert.throws(()=>validateHostRules([policy("a"),policy("a")]),/Duplicate/);
  assert.throws(()=>validateHostRules(Array.from({length:101},(_,i)=>policy("a"+i))),/100/);
  assert.throws(()=>readRuleProfile(" ".repeat(262145)),/256/);
  assert.throws(()=>readRuleProfile({schemaVersion:2,type:"url-parameter-cleaner-rule-profile",removeRules:[],keepRules:[],hostRules:[{host:"a"}]}));
});
test("host removal audit values remain redacted",()=>{
  const r=cleanUrl("https://shop.example/?ref=PRIVATE",{hostRules:[policy("shop.example")]});
  assert(!JSON.stringify(createAuditExport([r])).includes("PRIVATE"));
});
