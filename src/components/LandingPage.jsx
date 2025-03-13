import { Link } from "react-router-dom"
import "./LandingPage.css"

const LandingPage = () => {
  return (
    <div className="landing-page">
      <header>
        <div className="container">
          <nav>
            <div className="logo">
              <span className="logo-doe">DOE</span>
              <span className="logo-text">Travel Authority</span>
            </div>
            <div className="nav-links">
              {/* <a href="#features">Features</a>
              <a href="#process">Process</a>
              <a href="#faq">FAQ</a> */}
              <Link to="/login">Login</Link>
              <Link to="/signup" className="signup-button">
                Sign Up
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Streamlined Travel Requests for Educators</h1>
            <p>
              The Department of Education's official platform for managing professional development and educational
              travel requests.
            </p>
            <Link to="/signup" className="cta-button">
              Get Started
            </Link>
          </div>
          <div className="hero-image">
            <img src="/placeholder.svg?height=400&width=600" alt="Teachers on educational trips" />
          </div>
        </div>
      </section>

      {/* <section id="features" className="features">
        <div className="container">
          <h2>Simplifying Educational Travel</h2>
          <div className="feature-cards">
            <div className="feature-card">
              <h3>Streamlined Approvals</h3>
              <p>Automated workflow for faster travel request approvals from administrators.</p>
            </div>
            <div className="feature-card">
              <h3>Budget Management</h3>
              <p>Track department and school travel budgets with real-time reporting.</p>
            </div>
            <div className="feature-card">
              <h3>Compliance Assurance</h3>
              <p>Ensures all travel requests meet department guidelines and requirements.</p>
            </div>
          </div>
        </div>
      </section> */}

      <section id="process" className="process">
        <div className="container">
          <h2>How It Works</h2>
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <h3>Create Account</h3>
              <p>Sign up with your department credentials and complete your profile.</p>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <h3>Submit Request</h3>
              <p>Fill out the travel request form with all necessary details and documentation.</p>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <h3>Approval Process</h3>
              <p>Track your request as it moves through the approval workflow.</p>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <h3>Travel & Report</h3>
              <p>Access your approved travel details and submit post-travel reports.</p>
            </div>
          </div>
        </div>
      </section>

      {/* <section id="faq" className="faq">
        <div className="container">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-items">
            <div className="faq-item">
              <h3>Who can use the Travel Authority platform?</h3>
              <p>All Department of Education employees including teachers, administrators, and staff members.</p>
            </div>
            <div className="faq-item">
              <h3>How far in advance should I submit my travel request?</h3>
              <p>
                We recommend submitting requests at least 4 weeks before your intended travel date to allow for
                processing time.
              </p>
            </div>
            <div className="faq-item">
              <h3>Can I track the status of my request?</h3>
              <p>Yes, you can monitor your request status in real-time through your dashboard after logging in.</p>
            </div>
            <div className="faq-item">
              <h3>What documentation do I need to submit with my request?</h3>
              <p>
                Required documents typically include event details, cost estimates, educational justification, and
                principal approval.
              </p>
            </div>
          </div>
        </div>
      </section> */}

      {/* <section className="cta-section">
        <div className="container">
          <h2>Ready to Streamline Your Educational Travel?</h2>
          <p>
            Join thousands of educators who are already using the Department of Education's Travel Authority platform.
          </p>
          <Link to="/signup" className="cta-button">
            Sign Up Now
          </Link>
        </div>
      </section> */}

      {/* <footer>
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <span className="logo-doe">DOE</span>
              <span className="logo-text">Travel Authority</span>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Resources</h4>
                <a href="#">User Guide</a>
                <a href="#">Travel Policies</a>
                <a href="#">Forms & Documents</a>
              </div>
              <div className="footer-column">
                <h4>Support</h4>
                <a href="#">Help Center</a>
                <a href="#">Contact Us</a>
                <a href="#">Report an Issue</a>
              </div>
              <div className="footer-column">
                <h4>Legal</h4>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Use</a>
                <a href="#">Accessibility</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Department of Education. All rights reserved.</p>
          </div>
        </div>
      </footer> */}
    </div>
  )
}

export default LandingPage

