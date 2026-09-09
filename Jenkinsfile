pipeline {
  agent any

  stages {
    stage('Deploy Vercel') {
      when { branch 'main' }
      steps {
        withCredentials([
          string(credentialsId: 'econexus-vercel-token', variable: 'VERCEL_TOKEN'),
          string(credentialsId: 'econexus-vercel-org-id', variable: 'VERCEL_ORG_ID'),
          string(credentialsId: 'econexus-vercel-project-id', variable: 'VERCEL_PROJECT_ID')
        ]) {
          script {
            if (isUnix()) {
              sh 'npx vercel deploy --prod --yes --token="$VERCEL_TOKEN"'
            } else {
              powershell 'npx.cmd vercel deploy --prod --yes --token=$env:VERCEL_TOKEN'
            }
          }
        }
      }
    }

    stage('Deploy LangGraph') {
      when { branch 'main' }
      steps {
        withCredentials([string(credentialsId: 'econexus-render-deploy-hook', variable: 'RENDER_DEPLOY_HOOK_URL')]) {
          script {
            if (isUnix()) {
              sh 'curl --fail --silent --show-error -X POST "$RENDER_DEPLOY_HOOK_URL"'
            } else {
              powershell 'Invoke-WebRequest -Uri $env:RENDER_DEPLOY_HOOK_URL -Method POST -UseBasicParsing | Out-Null'
            }
          }
        }
      }
    }
  }
}
