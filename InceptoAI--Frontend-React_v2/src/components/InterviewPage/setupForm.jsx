import React from "react";

const companies = [
  "Google",
  "Amazon",
  "Microsoft",
  "Apple",
  "Meta",
  "Netflix",
  "Tesla",
  "Uber",
  "Airbnb",
  "Twitter",
  "LinkedIn",
  "Spotify",
  "Stripe",
  "Shopify",
  "Salesforce",
  "Oracle",
  "IBM",
  "Intel",
  "Adobe",
  "Nvidia",
];

const SetupForm = ({
  company,
  setCompany,
  role,
  setRole,
  handleSetupSubmit,
}) => {
  return (
    <div className="setup-container">
      <div className="setup-card">
        <div className="setup-header">
          <h2 className="setup-title">Welcome to Interview Analyzer</h2>
          <p className="setup-subtitle">
            Practice for your next interview with AI-powered analysis of your
            responses.
          </p>
        </div>
        <div className="setup-body">
          <form onSubmit={handleSetupSubmit} className="setup-form">
            <div className="form-group">
              <label htmlFor="company" className="form-label">
                Company
              </label>
              <div>
                <select
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="" disabled>
                    Select a company
                  </option>
                  {companies.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="role" className="form-label">
                Job Role
              </label>
              <div>
                <input
                  id="role"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Software Engineer, Product Manager"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <button type="submit" className="submit-button">
              Start Interview
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupForm;
