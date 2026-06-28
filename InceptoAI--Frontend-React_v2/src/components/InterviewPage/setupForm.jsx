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

const roles = [
  "Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "DevOps Engineer",
  "Machine Learning Engineer",
  "Data Scientist",
  "Data Analyst",
  "Product Manager",
  "Product Designer",
  "UX Designer",
  "UI Designer",
  "QA Engineer",
  "Site Reliability Engineer",
  "Cloud Engineer",
  "Security Engineer",
  "Mobile Engineer (iOS)",
  "Mobile Engineer (Android)",
  "Engineering Manager",
  "Business Analyst",
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
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="" disabled>
                    Select a role
                  </option>
                  {roles.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
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
