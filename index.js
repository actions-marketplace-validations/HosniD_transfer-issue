const Core = require('@actions/core');
const { Octokit }  = require("@octokit/rest")
const Github = require("@actions/github")


// most @actions toolkit packages have async methods
async function run() {
  try {
    Core.startGroup("🚦 Initializing...")

    Core.info("Auth with GitHub Token...")
    const octokit = new Octokit()
    Core.info("Done.")
    Core.endGroup()

    Core.startGroup("Importing inputs...")
    const repoSource = Core.getInput('repo-source') || Github.context.repo.repo
    const ownerSource = Core.getInput('owner-source') || Github.context.repo.owner
    const repoDestination = Core.getInput('repo-destination')
    const ownerDestination = Core.getInput('owner-destination')
    const issuesWithLabels = Core.getInput('labels').split(',')
    const issuesWithState = Core.getInput('state')
    Core.endGroup()

    Core.startGroup("📑 Getting all Issues in repository...")
    let page = 1
    let issuesPage
    do {
      Core.info(`Getting data from Issues page ${page}...`)

      issuesPage = await octokit.issues.listForRepo({
        owner: ownerSource,
        repo: repoSource,
        state: issuesWithState,
        labels: issuesWithLabels,
        page
      });
      Core.info(`issuesPageData ${issuesPage.data}`)

      for (let issue of issuesPage.data) {
        Core.info(`issue ${issue}`)
        const newIssue = await octokit.issues.create({
          owner: ownerDestination,
          repo: repoDestination,
          title: issue.title,
          body: `${issue.body}
          link: ${issue.url}`,
          labels: ['auto']
        });
       Core.info(`New Issue ${newIssue} created in ${ownerDestination}/${repoDestination}`)
      }
      Core.info(`There are ${issuesPage.data.length} Issues...`)
      if (issuesPage.data.length) {
        Core.info("Next page...")
      }
      page++
    } while (issuesPage.data.length)
    Core.info(`All issues has been moved to ${ownerDestination}/${repoDestination}`)
  } catch (error) {
    Core.setFailed(error.message);
  }
}

run();
