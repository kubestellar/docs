import { DocsLayout } from './src/components/docs/DocsLayout';

// Custom MDX components without nextra-theme-docs
export function useMDXComponents(components) {
  return {
    // Wrapper component that wraps the entire MDX content with DocsLayout
    // Sidebar is now in the Next.js layout (persists across navigations)
    wrapper: ({ children, toc, metadata, sourceCode, pageMap: _pageMap, filePath, projectId, ...props }) => {
      return (
        <DocsLayout toc={toc} metadata={metadata} filePath={filePath} projectId={projectId}>
          {children}
        </DocsLayout>
      );
    },
    // You can add custom component mappings here
    // Example:
    // h1: (props) => <h1 className="custom-h1" {...props} />,
    // h2: (props) => <h2 className="custom-h2" {...props} />,
    // a: (props) => <a className="custom-link" {...props} />,
    ...components,
  };
}

