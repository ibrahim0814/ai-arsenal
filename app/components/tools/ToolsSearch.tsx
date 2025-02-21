import { SearchBar } from "./SearchBar";

interface ToolsSearchProps {
  onSearch: (query: string) => void;
}

export function ToolsSearch({ onSearch }: ToolsSearchProps) {
  return <SearchBar onSearch={onSearch} />;
}
