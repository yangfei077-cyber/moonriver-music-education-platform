import { auth0 } from '../lib/auth0';

export default async function ProfileServer() {
  const session = await auth0.getSession();
  const user = session?.user; 
  return ( 
    user && ( 
      <div> 
        <img src={user.picture} alt={user.name}/> 
        <h2>{user.name}</h2> 
        <p>{user.email}</p> 
      </div> 
    )  
  ); 
}
