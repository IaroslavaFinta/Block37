import { useState, useEffect } from "react";

const Registration = ({ register }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mailingAddress, setMailingAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [billingInformation, setBillingInformation] = useState("");

  const submit = (ev) => {
    ev.preventDefault();
    register({ email, password });
  };
  return (
    <div className="login">
          <h1>Register</h1>
    <form onSubmit={submit}>
      <label htmlFor="email" className="email">
        Email address:{" "}
        <input
          value={email}
          placeholder="email"
          onChange={(ev) => setEmail(ev.target.value)}
        />
      </label>
      <label htmlFor="password" className="password">
        Password: {" "}
        <input
          value={password}
          placeholder="password"
          onChange={(ev) => setPassword(ev.target.value)}
        />
      </label>
      <label htmlFor="firstName" className="firstName">
        First Name: {" "}
        <input
          value={firstName}
          placeholder="firstName"
          onChange={(ev) => setFirstName(ev.target.value)}
        />
      </label>
      <label htmlFor="lastName" className="lastName">
        Last Name: {" "}
        <input
          value={lastName}
          placeholder="lastName"
          onChange={(ev) => setLastName(ev.target.value)}
        />
      </label>
      <label htmlFor="mailingAddress" className="mailingAddress">
        Mailing Address: {" "}
        <input
        value={mailingAddress}
        placeholder="mailing address"
        onChange={(ev) => setMailingAddress(ev.target.value)}
      />
      </label>
      <label htmlFor="phoneNumber" className="phoneNumber">
        Phone number: {" "}
        <input
        value={phoneNumber}
        placeholder="phone number"
        onChange={(ev) => setPhoneNumber(ev.target.value)}
      />
      </label>
      <label htmlFor="billingInfo" className="billingInfo">
        Billing Information: {" "}
        <input
        value={billingInformation}
        placeholder="billing information"
        onChange={(ev) => setBillingInformation(ev.target.value)}
      />
      </label>
      <button>Register</button>
    </form>
    </div>
  );
};

const Login = ({ login }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (ev) => {
    ev.preventDefault();
    login({ email, password });
  };
  return (
    <div className="login">
          <h1>Login to your account</h1>
    <form onSubmit={submit}>
      <label htmlFor="email" className="email">
        Email: {" "}
        <input
        value={email}
        placeholder="email"
        onChange={(ev) => setEmail(ev.target.value)}
      />
      </label>
      <label htmlFor="password" className="password">
        Password: {" "}
        <input
        value={password}
        placeholder="password"
        onChange={(ev) => setPassword(ev.target.value)}
      />
      </label>
      <button>Login</button>
    </form>
    </div>
  );
};

function App() {
  const [auth, setAuth] = useState({});
  const [products, setProducts] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    attemptLoginWithToken();
  }, []);

  const attemptLoginWithToken = async () => {
    const token = window.localStorage.getItem("token");
    if (token) {
      const response = await fetch(`/api/auth/me`, {
        headers: {
          authorization: token,
        },
      });
      const json = await response.json();
      if (response.ok) {
        setAuth(json);
      } else {
        window.localStorage.removeItem("token");
      }
    }
  };

  // products
  useEffect(() => {
    const seeProducts = async () => {
      const response = await fetch("/api/products");
      const json = await response.json();
      setProducts(json);
    };
    seeProducts();
  }, []);

  const register = async (credentials) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const json = await response.json();
    if (response.ok) {
      window.localStorage.setItem("token", json.token);
      setSuccessMessage("Registered");
      console.log(json);
    } else {
      setError("Failed to register");
      console.log(json);
    }
  };

  const login = async (credentials) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const json = await response.json();
    if (response.ok) {
      window.localStorage.setItem("token", json.token);
      attemptLoginWithToken();
      setSuccessMessage("Login success");
    } else {
      setError("Failed to login");
      console.log(json);
    }
  };

  const logout = () => {
    window.localStorage.removeItem("token");
    setAuth({});
  };

  return (
    <>
      <Registration register={register} />
      {!auth.id ? (
        <Login login={login} />
      ) : (
        <button onClick={logout}>Logout {auth.email}</button>
      )}
      <ul>
        {products.map((product) => {
          return (
            <li key={product.id}>
              {product.name}
              <button>Add Product to Cart</button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default App;

