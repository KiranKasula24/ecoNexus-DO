pipeline {
  agent any

  stages {
    stage('Deploy Vercel') {
      when { branch 'main' }
      steps {
        withCredentials([string(credentialsId: 'econexus-vercel-deploy-hook', variable: 'VERCEL_DEPLOY_HOOK_URL')]) {
          script {
            if (isUnix()) {
              sh 'curl --fail --silent --show-error -X POST "$VERCEL_DEPLOY_HOOK_URL"'
            } else {
              powershell 'Invoke-WebRequest -Uri $env:VERCEL_DEPLOY_HOOK_URL -Method POST -UseBasicParsing | Out-Null'
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
