interface PageHeadingProps {
  children: React.ReactNode;
}

export default function PageHeading({ children }: PageHeadingProps) {
  return <h1 className="text-2xl font-bold text-text">{children}</h1>;
}
