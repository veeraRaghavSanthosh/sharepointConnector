// TypeScript type definitions for sharepointconnector

declare module 'sharepointconnector' {
  interface SharePointConfig {
    username: string;
    password: string;
    url: string;
  }

  interface SharePointError {
    message: string;
    code?: string;
    statusCode?: number;
  }

  interface ListField {
    Id: string;
    Title: string;
    InternalName: string;
    TypeAsString: string;
    Required: boolean;
    ReadOnlyField: boolean;
    [key: string]: any;
  }

  interface ListItem {
    Id: string;
    Title: string;
    Created?: string;
    Modified?: string;
    AuthorId?: number;
    EditorId?: number;
    [key: string]: any;
  }

  interface SharePointList {
    Id: string;
    Title: string;
    Description?: string;
    ItemCount?: number;
    Created?: string;
    Modified?: string;
    Items?: ListItem[];
    Fields?: ListField[];
    [key: string]: any;
  }

  interface ListCreateData {
    title: string;
    description?: string;
    template?: number;
    [key: string]: any;
  }

  interface ListUpdateData {
    Title?: string;
    Description?: string;
    [key: string]: any;
  }

  interface UserInfo {
    Id: string;
    Title: string;
    Email?: string;
    LoginName?: string;
    [key: string]: any;
  }

  interface ByteStreamResult {
    stream: NodeJS.ReadableStream;
    contentType?: string;
    contentLength?: number;
  }

  type Callback<T> = (error: SharePointError | null, result?: T) => void;
  type CallbackWithNextUrl<T> = (error: SharePointError | null, result?: T, nextUrl?: string) => void;

  interface ListsAPI {
    list(callback: CallbackWithNextUrl<SharePointList[]>): void;
    create(listData: ListCreateData, callback: Callback<SharePointList>): void;
    read(listId: string, callback: Callback<SharePointList>): void;
    read(listData: { title: string }, callback: Callback<SharePointList>): void;
    update(listId: string, updateData: ListUpdateData, callback: Callback<SharePointList>): void;
    update(updateData: ListUpdateData & { Id: string }, callback: Callback<SharePointList>): void;
    del(listId: string, callback: Callback<void>): void;
  }

  interface ListItemsAPI {
    list(listName: string, callback: CallbackWithNextUrl<ListItem[]>): void;
    listAll(listName: string, callback: Callback<ListItem[]>): void;
    create(listName: string, itemData: Partial<ListItem>, callback: Callback<ListItem>): void;
    read(listName: string, callback: Callback<ListItem[]>): void;
    read(listName: string, itemId: string, callback: Callback<ListItem>): void;
    del(listName: string, itemId: string, callback: Callback<void>): void;
    currentuser(listName: string, callback: Callback<UserInfo>): void;
    byteStream(folderName: string, filename: string, callback: Callback<ByteStreamResult>): void;
    byteStreamByFilePath(filePath: string, callback: Callback<ByteStreamResult>): void;
  }

  interface SharePointConnector {
    login(callback: Callback<void>): void;
    lists: ListsAPI;
    listItems: ListItemsAPI;
  }

  function SharePointConnector(config: SharePointConfig): SharePointConnector;

  export = SharePointConnector;
}