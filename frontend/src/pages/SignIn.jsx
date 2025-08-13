import React, { useState } from 'react';

function SignIn() {
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSignIn = (e) => {
    e.preventDefault();

    // For now: fake validation
    if (form.email === 'test@example.com' && form.password === 'password123') {
      alert('Signed in successfully!');
      // TODO: Redirect to home or dashboard
    } else {
      alert('Invalid email or password');
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '400px' }}>
      <h2 className="mb-4 text-center"> Sign In to ChainMall</h2>
      <form onSubmit={handleSignIn}>
        <div className="mb-3">
          <input
            type="email"
            name="email"
            className="form-control"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <input
            type="password"
            name="password"
            className="form-control"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">
          Sign In
        </button>
      </form>
    </div>
  );
}

export default SignIn;
