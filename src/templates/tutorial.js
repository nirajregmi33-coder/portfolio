import React from "react";
import { graphql, Link } from "gatsby";
import styled from "styled-components";

const StyledTutorial = styled.article`
  max-width: 800px;
  margin: 0 auto;
  padding: 60px 20px;

  h1 {
    font-size: clamp(28px, 5vw, 42px);
    margin-bottom: 20px;
  }

  .content {
    font-size: var(--fz-md);
    color: var(--lightest-slate);

    h2, h3 {
      margin-top: 25px;
    }

    pre {
      background: #1e1e1e;
      color: #f8f8f2;
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
    }
  }

  .back-link {
    display: inline-block;
    margin-top: 30px;
    color: var(--green);
  }
`;

export default function TutorialTemplate({ data }) {
  const { markdownRemark } = data;
  const { frontmatter, html } = markdownRemark;

  return (
    <StyledTutorial>
      <h1>{frontmatter.title}</h1>
      <div className="content" dangerouslySetInnerHTML={{ __html: html }} />
      <Link className="back-link" to="/">← Back to Tutorials</Link>
    </StyledTutorial>
  );
}

export const pageQuery = graphql`
  query($slug: String!) {
    markdownRemark(frontmatter: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
      }
    }
  }
`;
