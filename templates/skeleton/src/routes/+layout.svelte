<script>
  import "../app.css";
  import { Layout } from "svelteway";
  export let data;
  const theme = JSON.parse(data.data.theme);
</script>

<Layout {data}>
  <div data-theme={theme}>
    <slot />
  </div>
</Layout>
