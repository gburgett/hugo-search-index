/* tslint:disable:no-unused-expression */

import * as chai from 'chai'

import parser from './front_matter_parser'

describe('front_matter_parser', () => {
  it('should parse toml', () => {
    const content = `
+++
tags = ["git"]
date = "2017-04-22T18:53:41+02:00"
title = "Why use Git?"
categories = ["blog", "asdf"]

+++

asdf
some more content`

      // act
    const data = parser(content)

    // console.log('data', data)
    chai.expect(data.contents).to.equal(`
asdf
some more content`)

    const frontMatter = data.frontMatter
    chai.expect(frontMatter).to.not.be.empty
    chai.expect(frontMatter.tags).to.deep.equal(['git'])
    chai.expect(frontMatter.categories).to.deep.equal(['blog', 'asdf'])
    chai.expect(frontMatter.date).to.equal('2017-04-22T18:53:41+02:00')
    chai.expect(frontMatter.title).to.equal('Why use Git?')
  })

  it('should parse yaml', () => {
    const content = `
---
tags:
  - "git"
date: "2017-04-22T18:53:41+02:00"
title: "Why use Git?"
categories:
  - blog
  - "asdf"
---

asdf
some more content`

      // act
    const data = parser(content)

    // console.log('data', data)
    chai.expect(data.contents).to.equal(`
asdf
some more content`)

    chai.expect(data.frontMatter).to.not.be.empty
    chai.expect(data.frontMatter.tags).to.deep.equal(['git'])
    chai.expect(data.frontMatter.categories).to.deep.equal(['blog', 'asdf'])
    chai.expect(data.frontMatter.date).to.equal('2017-04-22T18:53:41+02:00')
    chai.expect(data.frontMatter.title).to.equal('Why use Git?')
  })

  it('should parse json', () => {
    const content = `{
  "tags": ["git"],
  "date": "2017-04-22T18:53:41+02:00",
  "title": "Why use Git?",
  "categories": [
    "blog",
    "asdf"
  ]
}

asdf
some more content`

      // act
    const data = parser(content)

    // console.log('data', data)
    chai.expect(data.contents).to.equal(`asdf
some more content`)

    chai.expect(data.frontMatter).to.not.be.empty
    chai.expect(data.frontMatter.tags).to.deep.equal(['git'])
    chai.expect(data.frontMatter.categories).to.deep.equal(['blog', 'asdf'])
    chai.expect(data.frontMatter.date).to.equal('2017-04-22T18:53:41+02:00')
    chai.expect(data.frontMatter.title).to.equal('Why use Git?')
  })

  it('should handle no front matter', () => {
    const content = `

no front matter
this is all content
`
      // act
    const data = parser(content)

    // console.log('data', data)
    chai.expect(data.contents).to.equal(`

no front matter
this is all content
`)

    chai.expect(data.frontMatter).to.deep.equal({})
  })

  it('should handle empty yaml', () => {
    const content = `---
---

no front matter
this is all content
`
      // act
    const data = parser(content)

    // console.log('data', data)
    chai.expect(data.contents).to.equal(`
no front matter
this is all content
`)

    chai.expect(data.frontMatter).to.deep.equal({})
  })

  it('should handle empty toml', () => {
    const content = `+++
+++

no front matter
this is all content
`
      // act
    const data = parser(content)

    // console.log('data', data)
    chai.expect(data.contents).to.equal(`
no front matter
this is all content
`)

    chai.expect(data.frontMatter).to.deep.equal({})
  })

  it('should handle empty json', () => {
    const content = `{}

no front matter
this is all content
`
      // act
    const data = parser(content)

    // console.log('data', data)
    chai.expect(data.contents).to.equal(`no front matter
this is all content
`)

    chai.expect(data.frontMatter).to.deep.equal({})
  })
})
