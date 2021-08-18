const Core = require('@actions/core');
const { Octokit }  = require("@octokit/rest")
const Github = require("@actions/github")


// most @actions toolkit packages have async methods
async function run() {
  try {
    Core.startGroup("🚦 Initializing...")
    const authSecret = Core.getInput('auth-secret')

    Core.info("Auth with GitHub Token...")
    const octokit = new Octokit(
      {
        auth: authSecret,
      }
    )
    Core.info("Done.")
    Core.endGroup()

    Core.startGroup("Importing inputs...")
    const repoSource = Core.getInput('repo-source') || Github.context.repo.repo
    const ownerSource = Core.getInput('owner-source') || Github.context.repo.owner
    const repoDestination = Core.getInput('repo-destination')
    const ownerDestination = Core.getInput('owner-destination')
    const issuesWithLabels = Core.getInput('labels') ? Core.getInput('labels').split(',') : []
    const issuesWithState = Core.getInput('state')

    console.log('repoSource', repoSource)
    console.log('repoDestination', repoDestination)
    console.log('ownerSource', ownerSource)
    console.log('ownerDestination', ownerDestination)
    console.log('issuesWithLabels', issuesWithLabels)
    console.log('issuesWithState', issuesWithState)
    Core.endGroup()

    const issuesDataSource = await getIssues(octokit, ownerSource, repoSource, issuesWithState, issuesWithLabels)
    const issuesDataDestination = await getIssues(octokit, ownerDestination, repoDestination, null, null)

    const titlesSource = issuesDataSource.map(s => s.title)
    const titlesDestination = issuesDataDestination.map(s => s.title)

    const newTitle = titlesSource.filter(s => !titlesDestination.includes(s))


    const newIssues = issuesDataSource.filter(s => newTitle.includes(s.title))

    if (newIssues.length) {
      console.log(`There are ${newIssues.length} new issues`)
    } else {
      console.log(`There are no new issues`)
    }

    for (let issue of newIssues) {
      await octokit.issues.create({
        owner: ownerDestination,
        repo: repoDestination,
        title: issue.title,
        body: `${issue.body}
          link: ${issue.url}`,
        labels: ['support-bot']
      });
      Core.info(`New Issue ${issue.title} created in ${ownerDestination}/${repoDestination}`)
    }
    if (newIssues.length) {
      Core.info(`All issues has been moved to ${ownerDestination}/${repoDestination}`)
    }
  } catch (error) {
    console.log('error', error)
    Core.setFailed(error.message);
  }
}
async function getIssues(octokit, owner, repo, state, labels) {

  Core.startGroup(`📑 Getting all Issues in repository ${owner}/${repo}...`)
  let page = 1
  let issuesPage
  let issuesData = []
  do {
    issuesPage = await octokit.issues.listForRepo({
      owner: owner,
      repo: repo,
      ...(state && {state: state}),
      ...(labels && {labels: labels}),
      page
    });
    issuesData = issuesData.concat(issuesPage.data)
    page++
  } while (issuesPage.data.length)
  Core.info(`${issuesData.length} collected...`)
  return issuesData
}

run();
