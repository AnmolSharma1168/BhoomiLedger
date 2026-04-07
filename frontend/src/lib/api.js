const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function getToken(){

  try{
    return localStorage.getItem("bl_token");
  }
  catch(e){
    return null;
  }

}

async function request(path, options = {}) {

  const token = getToken();

  const headers = {
    "Content-Type": "application/json"
  };

  if(token){
    headers["Authorization"] = "Bearer " + token;
  }

  if(options.headers){
    Object.assign(headers,options.headers);
  }

  const res = await fetch(
    BASE_URL + path,
    {
      ...options,
      headers
    }
  );

  const data = await res.json();

  if(path.includes("/auth/login") && !res.ok && data.requiresVerification){
    return data;
  }

  if(!res.ok){
    throw new Error(data.message || "Request failed");
  }

  return data;

}

export const api = {

  get:(path)=>request(path),

  post:(path,body)=>
    request(
      path,
      {
        method:"POST",
        body:JSON.stringify(body)
      }
    ),

  login:(email,password)=>
    request(
      "/auth/login",
      {
        method:"POST",
        body:JSON.stringify({email,password})
      }
    ),

  register:(name,email,password)=>
    request(
      "/auth/register",
      {
        method:"POST",
        body:JSON.stringify({name,email,password})
      }
    ),

  me:()=>request("/auth/me"),

  stats:()=>request("/dashboard/stats"),

  getParcels:(params)=>
    request("/parcels?" + (params || "")),

  getParcel:(id)=>
    request("/parcels/" + id),

  createParcel:(data)=>
    request(
      "/parcels",
      {
        method:"POST",
        body:JSON.stringify(data)
      }
    ),

  updateParcel:(id,data)=>
    request(
      "/parcels/" + id,
      {
        method:"PATCH",
        body:JSON.stringify(data)
      }
    ),

  deleteParcel:(id)=>
    request(
      "/parcels/" + id,
      {
        method:"DELETE"
      }
    ),

  uploadDocument:(parcelId,file,docName)=>{

    const token = getToken();

    const formData = new FormData();

    formData.append("document",file);
    formData.append("docName",docName);

    return fetch(

      BASE_URL + "/parcels/" + parcelId + "/documents",

      {
        method:"POST",

        headers:{
          Authorization:"Bearer " + token
        },

        body:formData

      }

    )
    .then(r=>r.json())
    .then(d=>{

      if(!d.success){
        throw new Error(d.message);
      }

      return d;

    });

  },

  deleteDocument:(parcelId,docIndex)=>
    request(
      "/parcels/" + parcelId + "/documents/" + docIndex,
      {
        method:"DELETE"
      }
    ),

  getTransfers:(params)=>
    request("/transfers?" + (params || "")),

  createTransfer:(data)=>
    request(
      "/transfers",
      {
        method:"POST",
        body:JSON.stringify(data)
      }
    ),

  advanceTransfer:(id,data)=>
    request(
      "/transfers/" + id + "/step",
      {
        method:"PATCH",
        body:JSON.stringify(data)
      }
    ),

  getLoans:(params)=>
    request("/loans?" + (params || "")),

  createLoan:(data)=>
    request(
      "/loans",
      {
        method:"POST",
        body:JSON.stringify(data)
      }
    ),

  repayLoan:(id,amount)=>
    request(
      "/loans/" + id + "/repay",
      {
        method:"PATCH",
        body:JSON.stringify({amount})
      }
    ),

  getWills:(params)=>
    request("/inheritance?" + (params || "")),

  createWill:(data)=>
    request(
      "/inheritance",
      {
        method:"POST",
        body:JSON.stringify(data)
      }
    ),

  executeWill:(id)=>
    request(
      "/inheritance/" + id + "/execute",
      {
        method:"PATCH"
      }
    ),

  revokeWill:(id)=>
    request(
      "/inheritance/" + id + "/revoke",
      {
        method:"PATCH"
      }
    ),

  verifyEmail:(email,code)=>
    request(
      "/auth/verify-email",
      {
        method:"POST",
        body:JSON.stringify({email,code})
      }
    ),

  resendCode:(email)=>
    request(
      "/auth/resend-code",
      {
        method:"POST",
        body:JSON.stringify({email})
      }
    ),

  forgotPassword:(email)=>
    request(
      "/auth/forgot-password",
      {
        method:"POST",
        body:JSON.stringify({email})
      }
    ),

  resetPassword:(email,code,newPassword)=>
    request(
      "/auth/reset-password",
      {
        method:"POST",
        body:JSON.stringify({email,code,newPassword})
      }
    ),

  getMyDocuments:(params)=>
    request("/documents/my-requests?" + (params || "")),

  uploadDocument:(parcelId,documentName,documentType,file)=>{
    const token = getToken();
    const formData = new FormData();
    formData.append("document", file);
    formData.append("parcelId", parcelId);
    formData.append("documentName", documentName);
    formData.append("documentType", documentType);
    
    return fetch(BASE_URL + "/documents/upload", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: formData
    })
    .then(r => r.json())
    .then(d => {
      if (!d.success) throw new Error(d.message);
      return d;
    });
  },

};