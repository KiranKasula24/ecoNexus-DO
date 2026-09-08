pipeline {
  agent any

  stages {
    stage('Verify web') {
      steps {
        script {
          if (isUnix()) {
            sh 'npm ci'
          } else {
            powershell 'npm.cmd ci'
          }
        }
        withCredentials([
          string(credentialsId: 'econexus-supabase-url', variable: 'NEXT_PUBLIC_SUPABASE_URL'),
          string(credentialsId: 'econexus-supabase-publishable-key', variable: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
        ]) {
          script {
            if (isUnix()) {
              sh 'npm run build'
            } else {
              powershell 'npm.cmd run build'
            }
          }
        }
      }
    }

    stage('Verify LangGraph') {
      steps {
        dir('python/langgraph_agents') {
          script {
            if (isUnix()) {
              sh 'python3 -m pip install -r requirements.txt'
              sh 'python3 -m pytest -q'
            } else {
              powershell 'python -m pip install -r requirements.txt'
              powershell 'python -m pytest -q'
            }
          }
        }
      }
    }

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
              sh '''npx vercel pull --yes --environment=production --token="$VERCEL_TOKEN"
npx vercel build --prod --token="$VERCEL_TOKEN"
npx vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN"'''
            } else {
              powershell 'npx.cmd vercel pull --yes --environment=production --token=$env:VERCEL_TOKEN; npx.cmd vercel build --prod --token=$env:VERCEL_TOKEN; npx.cmd vercel deploy --prebuilt --prod --token=$env:VERCEL_TOKEN'
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
