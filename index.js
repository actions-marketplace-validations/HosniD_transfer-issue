const Core = require('@actions/core');
const { Octokit }  = require("@octokit/rest")
const Github = require("@actions/github")


// most @actions toolkit packages have async methods
async function run() {
  try {
    Core.startGroup("🚦 Checking Inputs and Initializing...")

    const repoSource = Core.getInput('repo-source')
    const repoDestination = Core.getInput('repo-destination')

    Core.info("Auth with GitHub Token...")
    const octokit = new Octokit()
    Core.info("Done.")
    Core.endGroup()

    Core.startGroup("📑 Getting all Issues in repository...")
    let page = 1
    const issuesData = []
    let issuesPage
    do {
      Core.info(`Getting data from Issues page ${page}...`)
      console.log('log::repoSource', repoSource)
      Core.info(`repoSource:: ${repoSource}`)
      issuesPage = await octokit.issues.listForRepo({
        owner: Github.context.repo.owner,
        repo: Github.context.repo.repo,
        state: "all",
        page
      });
      console.log('issuesPage', issuesPage)
      Core.info(`There are ${issuesPage.data.length} Issues...`)
      issuesData.push(issuesPage.data)
      if (issuesPage.data.length) {
        Core.info("Next page...")
      }
      page++
    } while (issuesPage.data.length)
    console.log('issuesData', issuesData)

    // Core.setOutput('time', new Date().toTimeString());
  } catch (error) {
    Core.setFailed(error.message);
  }
}

run();
