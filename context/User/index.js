import React, { useState } from 'react';
import cookie from 'react-cookies';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const SERVER_URL = import.meta.env.VITE_DEV_SERVER_URL || 'http://localhost:3001'

export const AuthContext = React.createContext(); 
/*
to-do:
-- setting up fake/test user
-- figure out auth backend
*/


/*
const testUsers = {
  Administrator: {
    password: 'admin',
    name: 'Administrator',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiQWRtaW5pc3RyYXRvciIsInJvbGUiOiJhZG1pbiIsImNhcGFiaWxpdGllcyI6IlsnY3JlYXRlJywncmVhZCcsJ3VwZGF0ZScsJ2RlbGV0ZSddIiwiaWF0IjoxNTE2MjM5MDIyfQ.pAZXAlTmC8fPELk2xHEaP1mUhR8egg9TH5rCyqZhZkQ'
  },
  Editor: {
    password: 'editor',
    name: 'Editor',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiRWRpdG9yIiwicm9sZSI6ImVkaXRvciIsImNhcGFiaWxpdGllcyI6IlsncmVhZCcsJ3VwZGF0ZSddIiwiaWF0IjoxNTE2MjM5MDIyfQ.3aDn3e2pf_J_1rZig8wj9RiT47Ae2Lw-AM-Nw4Tmy_s'
  },
  Writer: {
    password: 'writer',
    name: 'Writer',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiV3JpdGVyIiwicm9sZSI6IndyaXRlciIsImNhcGFiaWxpdGllcyI6IlsnY3JlYXRlJ10iLCJpYXQiOjE1MTYyMzkwMjJ9.dmKh8m18mgQCCJp2xoh73HSOWprdwID32hZsXogLZ68'
  },
  User: {
    password: 'user',
    name: 'User',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiVXNlciIsInJvbGUiOiJ1c2VyIiwiY2FwYWJpbGl0aWVzIjoiWydyZWFkJ10iLCJpYXQiOjE1MTYyMzkwMjJ9.WXYvIKLdPz_Mm0XDYSOJo298ftuBqqjTzbRvCpxa9Go'
  },
};
*/
function AuthProvider(props) {

  const [loggedIn, setLoggedIn] = useState(true);  // in prod, should be set to false.
  const [user, setUser] = useState({ username: 'testuser', role: 'user' }); // in prod, should be null
  let [token, setToken] = React.useState(null);
  const [error, setError] = useState(null);
  const [capabilities, setCapabilities] = useState(null);


  const can = (capability) => {
    // more than 1 capability,  update this funciton to take and array of capbilities.
    return user?.capabilities?.includes(capability);
  }

  // we now should talk to the server.
  const login = async (username, password) => {
    // basic auth!
    // base64 encode the username and password
    let encodedCredentials = btoa(`${username}:${password}`);

    // attach to the request header
    try {
      const config = {
        method: 'post',
        url: `${SERVER_URL}/signin`,
        headers: { Authorization: `Basic ${encodedCredentials}` }
      }
      let response = await axios(config);
      // token comes back in the response
      if (response.data) {
        console.log(response.data);
        validateToken(response.data.token);
      }
    } catch (e) {
      console.log(e.message);
      setLoginState(loggedIn, token, user, e);
      console.error(e);
    }
  }

  const logout = () => {
    setLoginState(false, null, { capabilities: [] });
  }

  const validateToken = (token) => {
    try {
      let validUser = jwtDecode(token);
      setLoginState(true, token, validUser);
    }
    catch (e) {
      setLoginState(false, null, {capabilities: []}, e);
      console.log('Token Validation Error', e);
    }
  }

  React.useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const cookieToken = cookie.load('auth');
    const token = qs.get('token') || cookieToken || null;
    validateToken(token);
  }, []);

  const setLoginState = (loggedIn, token, user, error) => {
    cookie.save('auth', token);
    // this.setState({ token, loggedIn, user, error: error || null });
    setToken(token);
    setLoggedIn(loggedIn);
    setUser(user);
    setError(error || null);
  }
  console.log(loggedIn, user, error);

  return (
    <AuthContext.Provider value={{ loggedIn, can, login, token, logout, user, error, capabilities }}>
      {props.children}
    </AuthContext.Provider>
  )
}

export default AuthProvider;