import https from 'https';
import redis from 'redis';

const client = redis.createClient();

import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN
});

export async function getRepository(req, res, next) {
  let key = `repo:${req.params.owner}/${req.params.repo}`;

  client.get( key, async function(err, repoData) {
    if (repoData) {
      req.repository = JSON.parse(repoData);
    } else if (err || (repoData === null)) {
      let repo = await octokit.repos.get({
        owner: req.params.owner,
        repo: req.params.repo,
      });

      if (repo.data) {
        client.setex( key, 300, JSON.stringify(repo) );
        req.repository = repo.data;
      }
    } else {
      req.repository = { default_branch: 'main',
                         full_name: `${req.params.owner}/${req.params.repo}`
                       };
    }

    next();
  });
}

export async function get(req, res, next) {
  let options = {
    host: 'raw.githubusercontent.com',
    port: 443,
    path: `${req.repository.full_name}/${req.repository.default_branch}/${req.params.path}`,
    headers: {
      'Authorization': 'Basic ' + process.env.GITHUB_ACCESS_TOKEN
    }   
  };
  
  const request = https.get(options, function(response) {
    const contentType = response.headers['content-type'];

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=600');
    
    response.pipe(res);
  });

  request.on('error', function(e){
    res.sendStatus(500);
  });
}
