const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
let server, url, tmp;
before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'classroom-test-'));
  process.env.CLASSROOM_DB_FILE = path.join(tmp, 'test.json');
  const app = require('../app');
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  url = 'http://127.0.0.1:' + server.address().port;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  delete process.env.CLASSROOM_DB_FILE;
});
const req = (route, method = 'GET', body) => fetch(url + route, {
  method, headers: {'Content-Type':'application/json'},
  ...(body === undefined ? {} : {body: JSON.stringify(body)})
});
test('lists and statistics', async () => {
  for (const route of ['/api/classrooms','/api/users','/api/types','/api/bookings']) {
    const r = await req(route); assert.equal(r.status, 200); assert.ok(Array.isArray(await r.json()));
  }
  const r = await req('/api/stats'); assert.equal(r.status, 200);
  assert.equal(typeof (await r.json()).total, 'number');
});
test('booking CRUD and invalid time', async () => {
  const data = {classroom_id:1,user_group_id:1,lesson_type_id:1,booking_date:'2030-01-01',start_time:'10:00',end_time:'11:00',participant_count:3,status:'active',notes:'test'};
  assert.equal((await req('/api/bookings','POST',{...data,end_time:'09:00'})).status,400);
  const created = await req('/api/bookings','POST',data); assert.equal(created.status,200);
  const {id} = await created.json();
  assert.equal((await req('/api/bookings/'+id)).status,200);
  assert.equal((await req('/api/bookings/'+id,'PUT',{...data,notes:'edited'})).status,200);
  assert.equal((await (await req('/api/bookings/'+id)).json()).notes,'edited');
  assert.equal((await req('/api/bookings/'+id,'DELETE')).status,200);
  assert.equal((await req('/api/bookings/'+id)).status,404);
  assert.equal((await req('/api/bookings/999999')).status,404);
});
