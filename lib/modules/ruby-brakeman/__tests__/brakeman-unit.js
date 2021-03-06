'use strict'

/* eslint-disable no-unused-expressions */

const path = require('path')
const FileManager = require('../../../file-manager')
const { handles, run } = require('..')
const exec = require('../../../exec')

describe('Ruby Brakeman Module', () => {
  let fm
  const target = path.join(__dirname, 'sample', 'with-app')
  const sampleReportFile = path.join(__dirname, 'sample', 'report.json')
  const nonexistentReportFile = path.join(__dirname, 'sample', 'nope.json')

  beforeEach(() => {
    sinon.stub(exec, 'exists').resolves(true)
    sinon.stub(exec, 'command').resolves()
    fm = new FileManager({ target })
  })

  it('should handle rails projects', async () => {
    expect(await handles(fm)).to.be.true
  })

  it('should not run on missing executable', async () => {
    exec.exists.resolves(false)
    expect(await handles(fm)).to.be.false
  })

  it('should not run on missing app folder', async () => {
    const target = path.join(__dirname, 'sample', 'without-app')
    const fm = new FileManager({ target })

    expect(await handles(fm)).to.be.false
  })

  it('should execute command', async () => {
    await run(fm, sampleReportFile)
    expect(exec.command).to.have.been.calledWith(`brakeman . -f json -o ${sampleReportFile}`, { cwd: target, shell: '/bin/bash' })
  })

  it('should log high severity issues', async () => {
    const { results } = await run(fm, sampleReportFile)
    expect(results.high).to.deep.equal([{
      code: 'ruby-brakeman-SQL',
      offender: 'app/controllers/application_controller.rb',
      description: 'Possible SQL injection (http://brakemanscanner.org/docs/warning_types/sql_injection/)',
      mitigation: 'Check line 11'
    }])
  })

  it('should error when output was not created', async () => {
    const target = path.join(__dirname, 'sample', 'with-app')
    const fm = new FileManager({ target })
    const spy = sinon.spy(run)
    try { await run(fm, nonexistentReportFile) } catch (e) {}
    expect(spy).to.have.thrown
  })
})
