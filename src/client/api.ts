function isJson(str: any) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

async function getRequest<Res>(url: string) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).then((r) => r.json());

    return res as Res;
  } catch (err) {
    // if (error.code == 401) {
    //   // login
    // } else if (error.code === 403) {
    //   // alert permissions
    // }
    alert('Error during get request, see console');
    console.error(err);
    return null;
  }
}

async function postRequest<Req, Res>(url: string, body: Req) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(async (r) => {
      if (!r.ok) {
        throw new Error(await r.text());
      }
      return r.json();
    });

    return res as Res;
  } catch (err) {
    if (err.message && isJson(err.message)) {
      const errorObject = JSON.parse(err.message);
      console.log(errorObject);
    } else {
      console.error(err);
    }
    alert('Error during post request, see console');
    throw err;
  }
}

async function deleteRequest<Req, Res>(url: string, body?: Req) {
  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.json());

    return res as Res;
  } catch (err) {
    alert('Error during post request, see console');
    console.error(err);
    return null;
  }
}

export async function getRoom(roomCode: string) {
  return getRequest<GetRoomResponse>(`/api/rooms/${roomCode}`);
}
