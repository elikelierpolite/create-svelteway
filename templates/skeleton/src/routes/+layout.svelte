<script>
  import "../app.css";
  import { Layout } from "svelteway";
  export let data;
</script>

<Layout {data}>
  <slot />
</Layout>
