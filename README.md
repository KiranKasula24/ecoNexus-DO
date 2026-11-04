
# EcoNexus ♻️
### AI-Powered Circular Economy & Industrial Waste Optimization Platform

EcoNexus is an AI-powered circular economy platform designed to transform industrial waste into valuable resources by connecting manufacturers, recyclers, processors, and other stakeholders.

The platform helps identify opportunities for material reuse, recycling, and processing through intelligent material discovery, digital material passports, opportunity matching, and AI-assisted coordination.

Built using Next.js, TypeScript, Supabase, Python, FastAPI, and LangGraph, EcoNexus combines a modern web application with an independent AI-agent service.

**Live Application:** https://eco-nexus-do.vercel.app/

---

# 1. Project Overview

Traditional industrial waste management often suffers from fragmented information, limited visibility into material availability, and difficulty identifying suitable recycling or processing partners.

EcoNexus addresses these challenges by providing a centralized platform where industrial stakeholders can discover material opportunities and coordinate circular-economy activities.

## 1.1 Key Features

- **Material Discovery:** Discover available industrial materials and potential reuse opportunities.
- **Digital Material Passports:** Maintain structured information about materials, their properties, and lifecycle.
- **Opportunity Matching:** Identify potential connections between material suppliers and recyclers.
- **AI-Assisted Coordination:** Use specialized agents to support material discovery, opportunity analysis, and coordination.
- **Role-Based Dashboards:** Provide interfaces for different industrial stakeholders.
- **Material Flow Analytics:** Analyze material movement and associated economic and environmental indicators.
- **Agent Workflows:** Execute multi-step LangGraph workflows for opportunity generation and processing.

## 1.2 Project Objectives

- Improve the discoverability of industrial waste and reusable materials.
- Connect organizations that generate waste with organizations capable of processing it.
- Support traceability through digital material passports.
- Automate selected discovery and coordination tasks using AI agents.
- Provide a scalable and maintainable application architecture.
- Apply DevOps practices to development, testing, deployment, and monitoring.

---

# 2. System Architecture

EcoNexus follows a multi-component architecture consisting of a Next.js application, a Supabase backend, and a separate Python-based AI-agent service.

```text
                       USERS
                         |
                         v
              +----------------------+
              |    Next.js Frontend |
              | React + TypeScript   |
              +----------+-----------+
                         |
              +----------+-----------+
              |                      |
              v                      v
       +-------------+       +------------------+
       |  Supabase   |       |  Next.js API     |
       |             |       |  Routes          |
       | Auth        |       +--------+---------+
       | Database    |                |
       +-------------+                |
                                      v
                            +----------------------+
                            | Python Agent Service |
                            |                      |
                            | FastAPI               |
                            | LangGraph             |
                            +----------+-----------+
                                       |
                              +--------+--------+
                              |                 |
                              v                 v
                         +---------+      +------------+
                         | Supabase|      | Groq LLM   |
                         +---------+      +------------+

       DEPLOYMENT AND DEVOPS
       ---------------------
       GitHub --> Jenkins --> Vercel
                       |
                       +-------> Render

       Docker: Optional containerization layer
       Selenium: Optional browser automation layer
```

## 2.1 Frontend Layer

The frontend is developed using Next.js, React, and TypeScript.

It provides:
- User authentication interfaces.
- Role-oriented dashboards.
- Material discovery interfaces.
- Material passport management.
- Opportunity management.
- Analytics and visualization.
- Communication with backend APIs and agent services.

## 2.2 Backend and Database Layer

Supabase provides the database and authentication infrastructure.

The Next.js application also contains API routes that handle application-specific backend operations.

## 2.3 AI-Agent Layer

The Python service uses FastAPI and LangGraph.

It manages agent execution, including:
- Context ingestion.
- Nearest-centroid matching.
- Market synthesis.
- Pause and resume operations.
- Final output generation.

Groq can be used as the language-model provider for synthesis. When the API key is unavailable or an LLM request fails, the service supports deterministic fallback behavior.

---

# 3. Technology Stack

| Category | Technology | Purpose |
|---|---|---|
| Frontend | Next.js | Web application and server-side functionality |
| UI | React | Component-based user interface |
| Language | TypeScript | Type safety and maintainable frontend code |
| Styling | Tailwind CSS | Responsive UI styling |
| UI Components | Radix UI | Accessible interface primitives |
| Backend | FastAPI | Python API service |
| Agent Framework | LangGraph | Multi-step AI-agent workflows |
| LLM Provider | Groq | Language-model inference |
| Database | Supabase | Application data storage |
| Authentication | Supabase Auth | User authentication |
| Version Control | Git | Source-code version management |
| Repository | GitHub | Collaboration and source-code hosting |
| Code Review | CodeRabbit | AI-assisted pull-request review |
| Browser Testing | Selenium | Automated browser interaction |
| Backend Testing | Pytest | Python unit and integration testing |
| HTTP Testing | HTTPX | API and asynchronous HTTP testing |
| Containerization | Docker | Reproducible application environments |
| Frontend Hosting | Vercel | Next.js deployment |
| Backend Hosting | Render | Python service deployment |
| CI/CD | Jenkins | Deployment automation |

### Tool implementation status

The repository contains working configuration for the core application and deployment workflow. Some additional tools are intended for extending the DevOps workflow.

| Tool | Current repository evidence |
|---|---|
| Next.js | Implemented |
| React and TypeScript | Implemented |
| Supabase | Integrated |
| FastAPI | Implemented |
| LangGraph | Integrated |
| Groq | Optional integration |
| GitHub | Source repository |
| Jenkins | Jenkinsfile configured |
| Vercel | Frontend deployment target |
| Render | Python service configuration |
| Pytest | Test suite present |
| HTTPX | Test dependency present |
| Docker | No Dockerfile or Compose file included in this snapshot |
| Selenium | No Selenium test suite included in this snapshot |
| CodeRabbit | No repository-specific configuration included in this snapshot |

---

# 4. Repository Structure

```text
ecoNexus-DO/
│
├── public/
│   └── Static assets
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   └── api/
│   │
│   ├── components/
│   ├── contexts/
│   │
│   ├── lib/
│   │   ├── agents/
│   │   ├── calculations/
│   │   ├── database/
│   │   ├── material-intelligence/
│   │   └── passport/
│   │
│   └── types/
│
├── python/
│   └── langgraph_agents/
│       ├── app/
│       ├── tests/
│       │   ├── unit/
│       │   └── integration/
│       ├── requirements.txt
│       └── README.md
│
├── scripts/
│
├── supabase/
│   ├── migrations/
│   └── seeds/
│
├── Jenkinsfile
├── render.yaml
├── package.json
└── .env.example
```

---

# 5. DevOps Tools and Their Roles

## 5.1 Git and GitHub – Version Control

Git is used to maintain the source-code history of EcoNexus.

GitHub provides the centralized repository for collaboration and project management.

### Key responsibilities

- Track modifications to application code.
- Maintain development branches.
- Support collaboration between contributors.
- Store project configuration and deployment scripts.
- Provide a central source for CI/CD workflows.
- Support pull requests and code reviews.

Typical workflow:

```text
Developer
    |
    v
Local Changes
    |
    v
Git Commit
    |
    v
Git Push
    |
    v
GitHub Repository
    |
    v
Pull Request / Review
```

## 5.2 Notion and Eraser.io – Planning and Architecture

### Notion

Notion can be used to organize:
- Project requirements.
- Development tasks.
- Feature planning.
- Team responsibilities.
- Milestones and progress.

### Eraser.io

Eraser.io is useful for documenting:
- System architecture.
- Application components.
- Database relationships.
- API communication.
- Deployment architecture.
- Infrastructure diagrams.

These tools help establish a common understanding before implementation.

## 5.3 CodeRabbit – AI-Assisted Code Review

CodeRabbit provides AI-assisted code reviews through repository integrations.

It can analyze pull requests and identify potential problems before changes are merged.

### Important capabilities

- Identify possible bugs.
- Highlight security concerns.
- Detect maintainability issues.
- Suggest improvements to code structure.
- Review changes across multiple files.
- Provide contextual feedback on pull requests.

### EcoNexus workflow

```text
Developer creates a branch
          |
          v
      Push Changes
          |
          v
    Create Pull Request
          |
          v
   CodeRabbit Review
          |
          v
  Review Suggestions
          |
          v
   Developer Fixes Issues
          |
          v
     Merge Changes
```

CodeRabbit complements human code review; it does not replace testing or approval.

## 5.4 Docker – Application Containerization

Docker is a containerization platform that packages an application and its dependencies into a portable image.

A container provides an isolated execution environment, reducing differences between development and deployment environments.

### Why Docker is useful for EcoNexus

EcoNexus contains multiple application components:

- Next.js frontend.
- Python FastAPI service.
- LangGraph agent runtime.
- External database and authentication services.

The Python service has its own dependencies and runtime requirements. Containerizing it can make local execution and deployment more consistent.

### Docker concepts

| Concept | Description |
|---|---|
| Dockerfile | Instructions used to build an image |
| Image | Packaged application and dependencies |
| Container | Running instance of an image |
| Docker Engine | Runs and manages containers |
| Docker Compose | Defines and runs multiple related containers |
| Docker Hub | Registry for storing and distributing images |

### Example: Containerizing the Python agent service

A Dockerfile can be added inside `python/langgraph_agents/`:

```dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

Build the image:

```bash
docker build -t econexus-agent ./python/langgraph_agents
```

Run the container:

```bash
docker run -p 8001:8001 --env-file python/langgraph_agents/.env econexus-agent
```

The service can then be accessed locally at:

```text
http://localhost:8001
```

Health check:

```text
http://localhost:8001/health
```

### Benefits

- Consistent runtime environment.
- Dependency isolation.
- Easier local testing.
- Reproducible builds.
- Portability between development and hosting environments.
- Simplified future migration to container-based infrastructure.

**Implementation note:** The current repository snapshot does not include a Dockerfile or Docker Compose configuration. The example above describes an optional containerization setup, not an existing production deployment.

## 5.5 Selenium – Browser Automation and End-to-End Testing

Selenium is an open-source browser automation framework used to simulate user interactions with web applications.

It supports automated testing through real browsers such as Chrome and Firefox.

### Why Selenium is useful for EcoNexus

EcoNexus contains multiple user-facing workflows, including authentication, dashboards, material discovery, and opportunity management.

Manual testing of every workflow after every change can become repetitive.

Selenium can automate these interactions and verify that important application features behave as expected.

### Testing possibilities

| Test area | Example validation |
|---|---|
| Authentication | Verify login and logout workflows |
| Navigation | Verify dashboard navigation |
| Forms | Check required fields and form submissions |
| Material discovery | Verify material search and filtering |
| Digital passports | Verify passport page interactions |
| Opportunities | Verify opportunity listing and navigation |
| Responsiveness | Check behavior at different viewport sizes |

### Example Selenium test

The following is an example of how a browser smoke test could be written:

```python
import os
from selenium import webdriver
from selenium.webdriver.common.by import By

BASE_URL = os.getenv(
    "BASE_URL",
    "http://localhost:3000"
)

def test_homepage_loads():
    driver = webdriver.Chrome()

    try:
        driver.get(BASE_URL)

        assert driver.title
        assert driver.current_url.startswith(BASE_URL)

    finally:
        driver.quit()
```

Install Selenium:

```bash
pip install selenium pytest
```

Run the test:

```bash
pytest tests/selenium/
```

Selenium Manager can assist with browser-driver management for supported browsers.

### Suggested Selenium workflow

```text
Application Deployment
          |
          v
 Start Browser Session
          |
          v
 Open EcoNexus Application
          |
          v
 Execute User Interactions
          |
          v
 Validate Expected Results
          |
          v
 Capture Test Results
          |
          v
 Report Pass / Fail
```

Selenium is particularly useful for validating end-to-end behavior that unit tests cannot fully cover.

**Implementation note:** Selenium is not currently configured in the supplied repository snapshot. The examples describe how it can be integrated into the testing workflow.

## 5.6 Pytest and HTTPX – Backend Testing

Pytest is used to write and execute Python tests.

HTTPX provides an HTTP client that can be used to test API behavior.

The EcoNexus Python service includes unit and integration tests.

### Unit testing

Unit tests validate individual functions and components.

Examples in the repository include:

- Centroid matching.
- Agent graph contracts.
- LLM adapter behavior.
- Main application LLM mode.

### Integration testing

Integration tests verify interactions between multiple components.

The repository includes an integration test for the agent run start and resume workflow.

Run the test suite:

```bash
cd python/langgraph_agents

python -m pytest -q
```

### Testing workflow

```text
Python Code
     |
     v
  Pytest
     |
     v
 HTTPX / Test Clients
     |
     v
 API and Component Validation
     |
     v
 Test Results
```

## 5.7 Vercel – Frontend Deployment and Hosting

Vercel is a cloud platform designed for deploying modern web applications, particularly Next.js projects.

EcoNexus uses Vercel to host its Next.js frontend and application routes.

### Why Vercel?

Vercel provides features that are useful for modern frontend development:

- Git-based deployment workflows.
- Next.js framework integration.
- Managed build environments.
- Environment-variable configuration.
- Preview deployments.
- Production deployments.
- Deployment logs.
- Rollback and deployment management.

### EcoNexus deployment architecture

```text
       GitHub Repository
              |
              v
        Vercel Project
              |
              v
       Dependency Install
              |
              v
          Next Build
              |
              v
       Production Output
              |
              v
       Hosted Application
```

### Deployment configuration

The frontend requires environment variables such as:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
LANGGRAPH_AGENT_URL=your_render_service_url
```

These values should be configured in Vercel's project environment settings.

### Deployment process

1. Connect the GitHub repository to Vercel.
2. Configure the required environment variables.
3. Select the appropriate production branch.
4. Trigger a deployment.
5. Allow Vercel to install dependencies and build the Next.js application.
6. Verify the deployed application.
7. Inspect build logs if deployment fails.

Vercel also supports preview deployments, which can be useful for validating changes before merging them into the production branch.

### Useful commands

```bash
npm install
npm run build
npm run start
```

The project can also be deployed using the Vercel CLI when configured:

```bash
npx vercel
```

## 5.8 Render – Python Backend Deployment

Render is used as the hosting target for the Python FastAPI and LangGraph service.

The repository contains a `render.yaml` configuration file.

### Render configuration

The configuration defines:

| Setting | Value |
|---|---|
| Service name | econexus-langgraph |
| Runtime | Python |
| Root directory | python/langgraph_agents |
| Build command | pip install -r requirements.txt |
| Start command | uvicorn app.main:app --host 0.0.0.0 --port $PORT |
| Health-check endpoint | /health |
| Python version | 3.13.5 |
| Automatic deployment | Disabled |

### Deployment workflow

```text
        GitHub Repository
                |
                v
          Render Service
                |
                v
       Install Dependencies
                |
                v
        Start FastAPI Server
                |
                v
        Health Check: /health
                |
                v
         Running API Service
```

The frontend communicates with the Python service through the `LANGGRAPH_AGENT_URL` environment variable.

Render and Vercel therefore host separate components of the same application.

## 5.9 Supabase – Database and Authentication

Supabase provides backend infrastructure for EcoNexus.

Its main responsibilities include:

- User authentication.
- Database storage.
- Application data access.
- Material and opportunity information.
- Agent-generated data storage.

The application uses Supabase client libraries to communicate with the configured project.

### Authentication

Supabase Auth provides authentication functionality that can be integrated into the Next.js application.

### Database

The Supabase database stores application data used by different platform features.

The repository also contains a `supabase/` directory with database migrations and seed data.

### Security

Supabase service-role credentials must remain server-side.

They should never be exposed through browser-side environment variables or committed to source control.

## 5.10 Jenkins – Continuous Integration and Deployment Automation

Jenkins is an automation server used to execute pipeline workflows.

EcoNexus includes a root-level `Jenkinsfile` that defines two deployment-trigger stages.

### Pipeline stages

**Stage 1: Deploy Vercel**

- Retrieves the Vercel deployment-hook URL from Jenkins Credentials.
- Sends an HTTP POST request to the deployment hook.
- Supports Unix shell and Windows PowerShell execution.

**Stage 2: Deploy LangGraph**

- Retrieves the Render deployment-hook URL from Jenkins Credentials.
- Sends an HTTP POST request to trigger the Render deployment.
- Supports Unix shell and Windows PowerShell execution.

Both stages execute only when the pipeline is running for the `main` branch.

### Pipeline architecture

```text
             GitHub Repository
                     |
                     v
                Jenkins
                     |
             Branch: main?
                     |
             +-------+-------+
             |               |
             v               v
       Deploy Vercel   Deploy LangGraph
             |               |
             v               v
      Vercel Hook       Render Hook
             |               |
             v               v
       Next.js Build     Python Service
             |               |
             v               v
       Live Frontend     Live Backend
```

### Jenkins credentials

The pipeline expects these Jenkins Secret Text credentials:

| Credential ID | Purpose |
|---|---|
| econexus-vercel-deploy-hook | Vercel deployment hook URL |
| econexus-render-deploy-hook | Render deployment hook URL |

Deployment URLs are stored in Jenkins Credentials rather than hardcoded in the Jenkinsfile.

### Important distinction

Jenkins initiates the deployment process through deployment hooks. Vercel and Render perform the actual application builds and deployments.

---

# 6. Development Setup

## 6.1 Prerequisites

- Node.js 20 or later.
- npm.
- Python environment compatible with the service dependencies.
- Git.
- A Supabase project.
- Optional Groq API key.
- Docker, if using the optional containerized setup.
- Selenium and a supported browser, if adding browser automation.

## 6.2 Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>

cd ecoNexus-DO
```

## 6.3 Install Frontend Dependencies

```bash
npm install
```

## 6.4 Configure Environment Variables

Create a local environment file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Configure your Supabase project values and backend service URL.

## 6.5 Run the Frontend

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 6.6 Run the Python Service

Open another terminal:

```bash
cd python/langgraph_agents
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it.

Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Linux/macOS:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create the Python environment file:

```bash
cp .env.example .env
```

Start the service:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

The service will be available at:

```text
http://localhost:8001
```

---

# 7. API Endpoints

The Python LangGraph service exposes the following endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | /health | Checks service availability |
| POST | /runs/start | Starts a new agent run |
| POST | /runs/{run_id}/resume | Resumes a paused agent run |
| GET | /runs/{run_id} | Retrieves agent-run information |

The service uses LangGraph to coordinate multi-step execution.

---

# 8. Testing and Quality Assurance

Testing is an important part of the EcoNexus development lifecycle.

Different tools can validate different layers of the application.

| Testing type | Tool | Purpose |
|---|---|---|
| Static analysis / linting | ESLint | Identify code-quality issues |
| AI-assisted review | CodeRabbit | Review pull-request changes |
| Unit testing | Pytest | Validate individual Python components |
| API testing | HTTPX | Validate HTTP endpoints and interactions |
| Browser automation | Selenium | Validate complete user workflows |
| Build validation | Next.js | Verify production build |
| Deployment health checks | Render | Check backend service availability |

### Frontend lint

```bash
npm run lint
```

### Frontend production build

```bash
npm run build
```

### Python test suite

```bash
cd python/langgraph_agents
python -m pytest -q
```

### Suggested end-to-end test sequence

1. Start the frontend and backend.
2. Open the application in a browser.
3. Validate authentication.
4. Navigate to the dashboard.
5. Verify important material and opportunity workflows.
6. Check API responses.
7. Verify that the application handles errors appropriately.

Selenium can automate the browser-based portion of this workflow when the test suite is added.

---

# 9. Deployment Architecture

EcoNexus separates the web application and AI-agent service into independently hosted components.

| Component | Platform | Deployment responsibility |
|---|---|---|
| Next.js application | Vercel | Frontend and Next.js application routes |
| Python agent service | Render | FastAPI and LangGraph execution |
| Database | Supabase | Authentication and application data |
| CI/CD automation | Jenkins | Deployment-hook orchestration |
| Source control | GitHub | Version management and collaboration |

This separation allows frontend and backend components to be deployed independently.

For example, an update to the Python agent service does not require the frontend to be rebuilt unless frontend changes are also needed.

---

# 10. Monitoring and Operations

Monitoring helps identify service failures, deployment issues, and application errors.

EcoNexus can use the dashboards and logs provided by its hosting and backend platforms.

## Vercel

Useful for monitoring:

- Deployment status.
- Build logs.
- Runtime logs.
- Deployment failures.
- Application availability.

## Render

Useful for monitoring:

- Python service status.
- Application logs.
- Startup failures.
- Health-check results.
- Service restarts.

## Supabase

Useful for monitoring:

- Database activity.
- Authentication activity.
- API usage.
- Database performance.
- Database logs.

## Jenkins

Useful for monitoring:

- Pipeline execution.
- Deployment-trigger failures.
- Stage-level status.
- Credential and execution issues.

## Additional monitoring tools

The following tools can be considered as future extensions:

| Tool | Potential purpose |
|---|---|
| UptimeRobot | External availability monitoring |
| Sentry | Frontend and backend error tracking |
| Prometheus | Metrics collection |
| Grafana | Metrics visualization |
| OpenTelemetry | Distributed tracing and observability |
| Datadog | Centralized monitoring and observability |

These are possible extensions, not currently configured components of the repository.

---

# 11. Security and Configuration

Security is important because EcoNexus uses authentication, database credentials, API keys, and deployment hooks.

Recommended practices:

- Never commit `.env.local` or `.env` files.
- Store service-role keys in server-side environment variables.
- Store deployment-hook URLs in Jenkins Credentials.
- Do not expose private API keys through `NEXT_PUBLIC_` variables.
- Use Supabase Row Level Security policies where applicable.
- Restrict access to production credentials.
- Rotate any credential that has been accidentally exposed.
- Review pull requests before merging changes into the production branch.

---

# 12. Future Improvements

Potential improvements to the DevOps workflow include:

- Add Dockerfiles for the frontend and Python service.
- Introduce Docker Compose for local multi-service development.
- Integrate Selenium-based end-to-end testing.
- Add automated test execution to Jenkins before deployment.
- Integrate CodeRabbit into the pull-request review workflow.
- Introduce centralized error tracking using Sentry.
- Add uptime monitoring and alerting.
- Expand automated API and integration test coverage.
- Introduce deployment approval gates for production releases.

These improvements would strengthen repeatability, reliability, and observability across the platform.

---

# 13. Conclusion

EcoNexus combines a modern web application with an independent AI-agent service to support industrial material discovery and circular-economy workflows.

The project uses Next.js, React, and TypeScript for the frontend; Supabase for authentication and database functionality; and FastAPI with LangGraph for agent execution.

Its DevOps workflow incorporates GitHub for source control, Jenkins for deployment automation, Vercel for frontend hosting, and Render for backend hosting. Pytest and HTTPX provide backend testing capabilities, while Selenium and Docker offer clear opportunities to extend browser automation and environment consistency.

Together, these technologies provide a foundation for developing, testing, deploying, and operating a multi-component application.

---

# 14. References

- Next.js: https://nextjs.org/docs
- React: https://react.dev/
- TypeScript: https://www.typescriptlang.org/docs/
- Supabase: https://supabase.com/docs
- FastAPI: https://fastapi.tiangolo.com/
- LangGraph: https://docs.langchain.com/oss/python/langgraph/overview
- Groq: https://console.groq.com/docs
- Docker: https://docs.docker.com/
- Selenium: https://www.selenium.dev/documentation/
- Pytest: https://docs.pytest.org/
- HTTPX: https://www.python-httpx.org/
- Jenkins: https://www.jenkins.io/doc/
- Vercel: https://vercel.com/docs
- Render: https://render.com/docs
- Git: https://git-scm.com/doc
- GitHub: https://docs.github.com/
- CodeRabbit: https://docs.coderabbit.ai/
- Eraser: https://docs.eraser.io/
- Notion: https://www.notion.com/help
