import React, { useEffect, useRef } from 'react';
import { Link, useStaticQuery, graphql } from 'gatsby';
import styled from 'styled-components';
import sr from '@utils/sr';
import { srConfig } from '@config';
import { usePrefersReducedMotion } from '@hooks';

const StyledTutorialsSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 50px;

  h2 {
    font-size: clamp(24px, 5vw, var(--fz-heading));
    margin-bottom: 30px;
  }

  ul.tutorials-list {
    list-style: none;
    padding: 0;
    max-width: 700px;
    width: 100%;

    li {
      margin-bottom: 25px;
      padding: 20px;
      border-radius: var(--border-radius);
      background: var(--light-navy);
      box-shadow: var(--navy-shadow);
      transition: var(--transition);

      &:hover {
        transform: translateY(-5px);
      }

      a {
        font-size: 20px;
        font-weight: bold;
        color: var(--green);
        text-decoration: none;

        &:hover {
          color: var(--lightest-slate);
        }
      }

      p {
        margin-top: 10px;
        font-size: var(--fz-md);
        color: var(--light-slate);
      }
    }
  }
`;

const Tutorials = () => {
  const data = useStaticQuery(graphql`
    query {
      tutorials: allMarkdownRemark(
        filter: { fileAbsolutePath: { regex: "/content/tutorials/" } }
        sort: { fields: [frontmatter___date], order: DESC }
      ) {
        edges {
          node {
            frontmatter {
              title
              slug
            }
            excerpt(pruneLength: 150)
          }
        }
      }
    }
  `);

  const tutorials = data.tutorials.edges;

  const revealTitle = useRef(null);
  const revealList = useRef([]);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    sr.reveal(revealTitle.current, srConfig());
    revealList.current.forEach((el, i) => sr.reveal(el, srConfig(i * 100)));
  }, []);

  return (
    <StyledTutorialsSection>
      <h2 ref={revealTitle}>Technical Tutorials</h2>

      <ul className="tutorials-list">
        {tutorials.map(({ node }, i) => (
          <li key={node.frontmatter.slug} ref={el => (revealList.current[i] = el)}>
            <Link to={`/tutorials/${node.frontmatter.slug}`}>
              {node.frontmatter.title}
            </Link>
            <p>{node.excerpt}</p>
          </li>
        ))}
      </ul>
    </StyledTutorialsSection>
  );
};

export default Tutorials;
