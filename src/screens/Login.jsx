import React, { useState } from "react";

function Login({ setToken, setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`http://localhost:4000/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow w-80 space-y-4">
        <h2 className="text-lg font-semibold text-center">
          {isRegister ? "Register" : "Login"}
        </h2>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        />

        <button className="w-full bg-gray-900 text-white py-2 rounded-lg">
          {isRegister ? "Register" : "Login"}
        </button>

        <p
          className="text-sm text-center text-blue-600 cursor-pointer"
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister ? "Already have an account? Login" : "New here? Register"}
        </p>
      </form>
    </div>
  );
}

export default Login;
